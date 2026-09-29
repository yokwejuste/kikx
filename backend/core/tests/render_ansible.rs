mod common;

use std::path::PathBuf;

use common::render;

#[test]
fn renders_a_multi_file_role_with_distinct_paths() {
    let outcome = render("ansible/common-role", "web", &[]);

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

    let outcome = render("ansible/inventory", "cluster", &[("hosts", hosts)]);

    assert_eq!(outcome.files.len(), 1);
    let content = &outcome.files[0].content;
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
        {"group":"platform","children":["k8s"],"vars":{"ansible_user":"ops-admin","ansible_connection":"ssh"}}
    ]"#;

    let outcome = render("ansible/inventory", "cluster", &[("hosts", hosts)]);

    let content = &outcome.files[0].content;
    assert!(content.contains("[k8s_control_plane]"));
    assert!(content.contains("cp-01 ansible_host=10.0.0.1"));
    assert!(content.contains("[k8s:children]"));
    assert!(content.contains("k8s_control_plane"));
    assert!(content.contains("k8s_workers"));
    assert!(content.contains("[platform:children]"));
    assert!(content.contains("[platform:vars]"));
    assert!(content.contains("ansible_user=ops-admin"));
    assert!(content.contains("ansible_connection=ssh"));
}

#[test]
fn renders_group_vars_as_yaml() {
    let outcome = render(
        "ansible/group-vars",
        "web",
        &[
            ("group", "web"),
            ("vars", r#"{"app_port":"8080","env":"production"}"#),
        ],
    );

    assert_eq!(outcome.files.len(), 1);
    assert_eq!(outcome.files[0].path, PathBuf::from("group_vars/web.yml"));
    let content = &outcome.files[0].content;
    assert!(content.contains("app_port: 8080"));
    assert!(content.contains("env: production"));
}

#[test]
fn renders_playbook_assigning_roles_to_a_group() {
    let outcome = render(
        "ansible/playbook",
        "web-site",
        &[("hosts", "web"), ("roles", r#"["hygiene","nginx"]"#)],
    );

    assert_eq!(outcome.files.len(), 1);
    assert_eq!(outcome.files[0].path, PathBuf::from("web-site.yml"));
    assert_eq!(
        outcome.files[0].content,
        "---\n- name: web-site\n  hosts: web\n  become: true\n  roles:\n    - hygiene\n    - nginx\n"
    );
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
    assert!(content
        .contains("\n\n- name: Workers\n  hosts: k8s_workers\n  roles:\n    - kube_worker\n"));
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
        "pre_tasks":"- name: Annotate start\n  ansible.builtin.include_role:\n    name: notify_start\n",
        "roles":["db_repos",{"role":"tls","when":"tls_enabled | default(false)"},"postgres"],
        "post_tasks":"- name: Annotate finish\n  ansible.builtin.debug:\n    msg: done\n"
    }]"#;
    let content = render("ansible/playbook", "db", &[("plays", plays)])
        .files
        .remove(0)
        .content;

    assert_eq!(
        content,
        "---\n- name: Database tier\n  hosts: db\n  become: true\n  tags: [db]\n  pre_tasks:\n    - name: Annotate start\n      ansible.builtin.include_role:\n        name: notify_start\n  roles:\n    - db_repos\n    - role: tls\n      when: tls_enabled | default(false)\n    - postgres\n  post_tasks:\n    - name: Annotate finish\n      ansible.builtin.debug:\n        msg: done\n"
    );
}

#[test]
fn group_vars_can_use_the_directory_layout() {
    let outcome = render(
        "ansible/group-vars",
        "all",
        &[("group", "all"), ("layout", "dir"), ("yaml", "tz: UTC")],
    );
    assert_eq!(
        outcome.files[0].path,
        PathBuf::from("group_vars/all/main.yml")
    );
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
    assert!(outcome.files[0]
        .content
        .contains("{{ inventory_hostname }}"));
    assert!(outcome.files[3]
        .content
        .contains("description: The kube_worker role"));
}
