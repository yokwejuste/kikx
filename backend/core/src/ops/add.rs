use std::collections::{BTreeMap, HashSet};
use std::path::{Path, PathBuf};

use anyhow::anyhow;
use minijinja::{Environment, Value};

use super::error::{OpsError, OpsErrorKind};
use super::manifest::write_all;
use crate::config::KikxConfig;
use crate::registry;

pub struct RenderParams {
    pub reference: String,
    pub name: String,
    pub fields: Vec<(String, String)>,
    pub labels: Vec<(String, String)>,
    pub default_namespace: String,
}

#[derive(Debug)]
pub struct RenderedFile {
    pub path: PathBuf,
    pub content: String,
}

#[derive(Debug)]
pub struct RenderOutcome {
    pub component: String,
    pub files: Vec<RenderedFile>,
}

fn field_value(raw: &str) -> Value {
    let trimmed = raw.trim_start();
    if trimmed.starts_with('[') || trimmed.starts_with('{') {
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(raw) {
            return Value::from_serialize(&parsed);
        }
    }
    Value::from(raw)
}

pub fn render_component(params: RenderParams) -> Result<RenderOutcome, OpsError> {
    let item = registry::resolve(&params.reference)
        .map_err(|e| OpsError::new(OpsErrorKind::InvalidComponent, e))?;

    let supplied: BTreeMap<&str, &str> = params
        .fields
        .iter()
        .map(|(k, v)| (k.as_str(), v.as_str()))
        .collect();

    let mut ctx: BTreeMap<String, Value> = BTreeMap::new();
    ctx.insert("name".to_string(), Value::from(params.name.clone()));
    ctx.insert(
        "namespace".to_string(),
        Value::from(
            supplied
                .get("namespace")
                .map(|v| v.to_string())
                .unwrap_or(params.default_namespace),
        ),
    );

    for field in &item.fields {
        if field.name == "namespace" {
            continue;
        }
        let value = supplied
            .get(field.name.as_str())
            .map(|v| v.to_string())
            .or_else(|| field.default.clone());
        match value {
            Some(value) => {
                ctx.insert(field.name.clone(), field_value(&value));
            }
            None if field.required => {
                return Err(OpsError::new(
                    OpsErrorKind::MissingField,
                    anyhow!("--{} is required for {}", field.name, item.reference()),
                ));
            }
            None => {}
        }
    }
    for (key, value) in &supplied {
        ctx.entry((*key).to_string())
            .or_insert_with(|| field_value(value));
    }

    let mut labels: BTreeMap<String, String> = params.labels.iter().cloned().collect();
    labels
        .entry("app".to_string())
        .or_insert_with(|| params.name.clone());
    ctx.insert("labels".to_string(), Value::from_serialize(&labels));

    let mut env = Environment::new();
    env.set_keep_trailing_newline(true);

    let mut files = Vec::with_capacity(item.files.len());
    let mut seen_paths = HashSet::new();
    for registry_file in &item.files {
        let path_str = env
            .render_str(&registry_file.path, &ctx)
            .map_err(|e| OpsError::new(OpsErrorKind::Other, e.into()))?;
        let content = env
            .render_str(&registry_file.template, &ctx)
            .map_err(|e| OpsError::new(OpsErrorKind::Other, e.into()))?;
        let path = PathBuf::from(path_str);
        if !seen_paths.insert(path.clone()) {
            return Err(OpsError::new(
                OpsErrorKind::InvalidComponent,
                anyhow!(
                    "{} has two files that both render to `{}`",
                    item.reference(),
                    path.display()
                ),
            ));
        }
        files.push(RenderedFile { path, content });
    }

    Ok(RenderOutcome {
        component: item.name,
        files,
    })
}

pub struct AddParams {
    pub reference: String,
    pub name: String,
    pub fields: Vec<(String, String)>,
    pub labels: Vec<(String, String)>,
    pub force: bool,
    pub dry_run: bool,
}

pub struct AddOutcome {
    pub component: String,
    pub files: Vec<RenderedFile>,
    pub written: bool,
}

pub fn add_component(project_dir: &Path, params: AddParams) -> Result<AddOutcome, OpsError> {
    let config = KikxConfig::load(project_dir)
        .map_err(|e| OpsError::new(OpsErrorKind::NotInitialized, e))?;

    let outcome = render_component(RenderParams {
        reference: params.reference,
        name: params.name.clone(),
        fields: params.fields,
        labels: params.labels,
        default_namespace: config.project.default_namespace.clone(),
    })?;

    if params.dry_run {
        return Ok(AddOutcome {
            component: outcome.component,
            files: outcome.files,
            written: false,
        });
    }

    let output_dir = project_dir.join(&config.project.output_dir);
    write_all(&output_dir, &outcome.files, params.force)?;

    let files = outcome
        .files
        .into_iter()
        .map(|f| RenderedFile {
            path: output_dir.join(&f.path),
            content: f.content,
        })
        .collect();

    Ok(AddOutcome {
        component: outcome.component,
        files,
        written: true,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_a_multi_file_role_with_distinct_paths() {
        let outcome = render_component(RenderParams {
            reference: "ansible/common-role".to_string(),
            name: "web".to_string(),
            fields: vec![],
            labels: vec![],
            default_namespace: "default".to_string(),
        })
        .unwrap();

        assert_eq!(outcome.files.len(), 4);
        let paths: Vec<String> = outcome
            .files
            .iter()
            .map(|f| f.path.display().to_string())
            .collect();
        assert!(paths.contains(&"roles/web/tasks/main.yml".to_string()));
        assert!(paths.contains(&"roles/web/defaults/main.yml".to_string()));
        assert!(paths.contains(&"roles/web/handlers/main.yml".to_string()));
        assert!(paths.contains(&"roles/web/templates/motd.j2".to_string()));

        let motd = outcome
            .files
            .iter()
            .find(|f| f.path.ends_with("motd.j2"))
            .unwrap();
        assert!(motd.content.contains("Host: web"));
        assert!(motd.content.contains("{{ motd_message }}"));
    }

    #[test]
    fn renders_inventory_with_multiple_groups_and_hosts() {
        let hosts = r#"[
            {"group":"k8s_control_plane","members":[
                {"name":"cp-01","ansible_host":"10.0.0.1"},
                {"name":"cp-02","ansible_host":"10.0.0.2","ansible_user":"admin"}
            ]},
            {"group":"k8s_workers","members":[
                {"name":"worker-01","ansible_host":"10.0.1.1","ansible_port":2222,"ssh_key_file":"~/.ssh/id_ed25519"}
            ]}
        ]"#;

        let outcome = render_component(RenderParams {
            reference: "ansible/inventory".to_string(),
            name: "cluster".to_string(),
            fields: vec![("hosts".to_string(), hosts.to_string())],
            labels: vec![],
            default_namespace: "default".to_string(),
        })
        .unwrap();

        assert_eq!(outcome.files.len(), 1);
        let content = &outcome.files[0].content;
        println!("---\n{content}\n---");
        assert!(content.contains("[k8s_control_plane]"));
        assert!(content.contains("cp-01 ansible_host=10.0.0.1 ansible_user=root ansible_port=22"));
        assert!(content.contains("cp-02 ansible_host=10.0.0.2 ansible_user=admin ansible_port=22"));
        assert!(content.contains("[k8s_workers]"));
        assert!(content.contains(
            "worker-01 ansible_host=10.0.1.1 ansible_user=root ansible_port=2222 ansible_ssh_private_key_file=~/.ssh/id_ed25519"
        ));
    }

    #[test]
    fn renders_inventory_children_and_vars_groups() {
        let hosts = r#"[
            {"group":"k8s_control_plane","members":[{"name":"cp-01","ansible_host":"10.0.0.1"}]},
            {"group":"k8s_workers","members":[{"name":"worker-01","ansible_host":"10.0.1.1"}]},
            {"group":"k8s","children":["k8s_control_plane","k8s_workers"]},
            {"group":"alafia","children":["k8s"],"vars":{"ansible_user":"alafia-admin","ansible_connection":"ssh"}}
        ]"#;

        let outcome = render_component(RenderParams {
            reference: "ansible/inventory".to_string(),
            name: "cluster".to_string(),
            fields: vec![("hosts".to_string(), hosts.to_string())],
            labels: vec![],
            default_namespace: "default".to_string(),
        })
        .unwrap();

        let content = &outcome.files[0].content;
        println!("---\n{content}\n---");
        assert!(content.contains("[k8s_control_plane]"));
        assert!(content.contains("cp-01 ansible_host=10.0.0.1"));
        assert!(content.contains("[k8s:children]"));
        assert!(content.contains("k8s_control_plane"));
        assert!(content.contains("k8s_workers"));
        assert!(content.contains("[alafia:children]"));
        assert!(content.contains("[alafia:vars]"));
        assert!(content.contains("ansible_user=alafia-admin"));
        assert!(content.contains("ansible_connection=ssh"));
    }

    #[test]
    fn renders_group_vars_as_yaml() {
        let outcome = render_component(RenderParams {
            reference: "ansible/group-vars".to_string(),
            name: "web".to_string(),
            fields: vec![
                ("group".to_string(), "web".to_string()),
                (
                    "vars".to_string(),
                    r#"{"app_port":"8080","env":"production"}"#.to_string(),
                ),
            ],
            labels: vec![],
            default_namespace: "default".to_string(),
        })
        .unwrap();

        assert_eq!(outcome.files.len(), 1);
        assert_eq!(outcome.files[0].path, PathBuf::from("group_vars/web.yml"));
        let content = &outcome.files[0].content;
        assert!(content.contains("app_port: 8080"));
        assert!(content.contains("env: production"));
    }

    #[test]
    fn renders_playbook_assigning_roles_to_a_group() {
        let outcome = render_component(RenderParams {
            reference: "ansible/playbook".to_string(),
            name: "web-site".to_string(),
            fields: vec![
                ("hosts".to_string(), "web".to_string()),
                ("roles".to_string(), r#"["hygiene","nginx"]"#.to_string()),
            ],
            labels: vec![],
            default_namespace: "default".to_string(),
        })
        .unwrap();

        assert_eq!(outcome.files.len(), 1);
        assert_eq!(outcome.files[0].path, PathBuf::from("web-site.yml"));
        let content = &outcome.files[0].content;
        assert!(content.contains("hosts: web"));
        assert!(content.contains("- hygiene"));
        assert!(content.contains("- nginx"));
    }

    fn render(reference: &str, name: &str, fields: &[(&str, &str)]) -> RenderOutcome {
        render_component(RenderParams {
            reference: reference.to_string(),
            name: name.to_string(),
            fields: fields
                .iter()
                .map(|(k, v)| (k.to_string(), v.to_string()))
                .collect(),
            labels: vec![],
            default_namespace: "default".to_string(),
        })
        .unwrap()
    }

    #[test]
    fn inventory_omits_null_connection_vars_and_renders_host_vars() {
        let hosts = r#"[
            {"group":"cp","members":[{"name":"cp-01","ansible_host":"10.0.0.1","ansible_user":null,"ansible_port":null,"vars":{"kube_bootstrap":"true"}}]},
            {"group":"redis","members":[{"name":"cp-01","ansible_host":null,"ansible_user":null,"ansible_port":null}]},
            {"group":"all","vars":{"ansible_user":"admin"}}
        ]"#;
        let content = render("ansible/inventory", "site", &[("hosts", hosts)])
            .files
            .remove(0)
            .content;

        assert!(content.contains("cp-01 ansible_host=10.0.0.1 kube_bootstrap=true\n"));
        assert!(content.contains("[redis]\ncp-01\n"));
        assert!(!content.contains("ansible_user=root"));
        assert!(content.contains("[all:vars]\nansible_user=admin"));
    }

    #[test]
    fn group_vars_accepts_raw_yaml() {
        let content = render(
            "ansible/group-vars",
            "db",
            &[("group", "db"), ("yaml", "postgres:\n  version: 16\n\n")],
        )
        .files
        .remove(0)
        .content;

        assert_eq!(content, "---\npostgres:\n  version: 16\n");
    }

    #[test]
    fn playbook_renders_multiple_plays_into_a_folder() {
        let plays = r#"[
            {"name":"Prereqs","hosts":"k8s","become":true,"tags":["k8s"],"roles":["containerd","kube_common"]},
            {"name":"Workers","hosts":"k8s_workers","become":false,"tags":[],"roles":["kube_worker"]}
        ]"#;
        let outcome = render(
            "ansible/playbook",
            "k8s",
            &[("plays", plays), ("folder", "playbooks")],
        );

        assert_eq!(outcome.files[0].path, PathBuf::from("playbooks/k8s.yml"));
        let content = &outcome.files[0].content;
        assert!(content.contains(
            "- name: Prereqs\n  hosts: k8s\n  become: true\n  tags: [k8s]\n  roles:\n    - containerd\n    - kube_common\n"
        ));
        assert!(content.contains("\n\n- name: Workers\n  hosts: k8s_workers\n  roles:\n    - kube_worker\n"));
    }

    #[test]
    fn site_imports_playbooks_in_order() {
        let playbooks = r#"[{"name":"Bootstrap","path":"playbooks/bootstrap.yml"},{"name":"Kubernetes","path":"playbooks/k8s.yml"}]"#;
        let outcome = render("ansible/site", "site", &[("playbooks", playbooks)]);

        assert_eq!(outcome.files[0].path, PathBuf::from("site.yml"));
        assert_eq!(
            outcome.files[0].content,
            "---\n- name: Bootstrap\n  import_playbook: playbooks/bootstrap.yml\n- name: Kubernetes\n  import_playbook: playbooks/k8s.yml\n"
        );
    }

    #[test]
    fn playbook_renders_conditional_roles_and_pre_post_tasks() {
        let plays = r#"[{
            "name":"Database tier","hosts":"db","become":true,"tags":["db"],
            "pre_tasks":"- name: Annotate start\n  ansible.builtin.include_role:\n    name: monitoring_annotate\n",
            "roles":["db_repos",{"role":"db_tls","when":"db_tls_enabled | default(false)"},"postgres"],
            "post_tasks":"- name: Annotate finish\n  ansible.builtin.debug:\n    msg: done\n"
        }]"#;
        let content = render("ansible/playbook", "db", &[("plays", plays)])
            .files
            .remove(0)
            .content;

        assert_eq!(
            content,
            "---\n- name: Database tier\n  hosts: db\n  become: true\n  tags: [db]\n  pre_tasks:\n    - name: Annotate start\n      ansible.builtin.include_role:\n        name: monitoring_annotate\n  roles:\n    - db_repos\n    - role: db_tls\n      when: db_tls_enabled | default(false)\n    - postgres\n  post_tasks:\n    - name: Annotate finish\n      ansible.builtin.debug:\n        msg: done\n"
        );
    }

    #[test]
    fn group_vars_can_use_the_directory_layout() {
        let outcome = render(
            "ansible/group-vars",
            "all",
            &[("group", "all"), ("layout", "dir"), ("yaml", "tz: UTC")],
        );
        assert_eq!(outcome.files[0].path, PathBuf::from("group_vars/all/main.yml"));
    }

    #[test]
    fn role_skeleton_renders_four_files() {
        let outcome = render("ansible/role", "kube_worker", &[]);
        let paths: Vec<String> = outcome
            .files
            .iter()
            .map(|f| f.path.display().to_string())
            .collect();
        assert_eq!(
            paths,
            vec![
                "roles/kube_worker/tasks/main.yml",
                "roles/kube_worker/defaults/main.yml",
                "roles/kube_worker/handlers/main.yml",
                "roles/kube_worker/meta/main.yml",
            ]
        );
        assert!(outcome.files[0].content.contains("{{ inventory_hostname }}"));
        assert!(outcome.files[3].content.contains("description: The kube_worker role"));
    }

    #[test]
    fn rejects_two_files_rendering_to_the_same_path() {
        let item_json = r#"{"name":"dup","category":"acme","files":[{"path":"same.txt","template":"a"},{"path":"same.txt","template":"b"}]}"#;
        let tmp = tempfile::tempdir().unwrap();
        let item_path = tmp.path().join("dup.json");
        std::fs::write(&item_path, item_json).unwrap();

        let err = render_component(RenderParams {
            reference: item_path.to_str().unwrap().to_string(),
            name: "x".to_string(),
            fields: vec![],
            labels: vec![],
            default_namespace: "default".to_string(),
        })
        .unwrap_err();

        assert_eq!(err.kind, OpsErrorKind::InvalidComponent);
    }
}
