# Render your own component from a registry item

Use this when kikx has no built-in component for a file you need. You describe the component in a `registry-item.json` and load it from a local path or a URL, without updating kikx.

## 1. Write the registry item

```json
{
  "name": "configmap",
  "category": "k8s",
  "title": "ConfigMap",
  "description": "Plain key/value configuration for pods.",
  "fields": [
    {
      "name": "data",
      "required": true,
      "description": "JSON map of keys to values.",
      "example": "{\"LOG_LEVEL\":\"info\"}"
    },
    {
      "name": "immutable",
      "default": "false",
      "options": [
        { "value": "false", "label": "Editable" },
        { "value": "true", "label": "Immutable" }
      ]
    }
  ],
  "files": [
    {
      "path": "{{ name }}-configmap.yaml",
      "template": "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: {{ name }}\n  namespace: {{ namespace }}\n  labels:\n{% for key, value in labels|items %}    {{ key }}: {{ value }}\n{% endfor %}immutable: {{ immutable }}\ndata:\n{% for key in data %}  {{ key }}: \"{{ data[key] }}\"\n{% endfor %}"
    }
  ]
}
```

What matters when you write one:

- `name`, `category` and `files` are required. Every other key is optional.
- Each file's `path` and `template` are Jinja templates rendered with MiniJinja. Paths must be relative and can't climb out of the output directory with `..`.
- Templates can use `name`, `namespace`, `labels` (which always includes `app: <name>`), and every field by its `name`.
- A field value that starts with `[` or `{` and parses as JSON arrives as a list or map. Anything else arrives as a string.
- A `required` field without a `default` must be supplied, or rendering fails.

For every key, see the [Registry item format reference](../reference/registry-item-format.md).

## 2. Render it with the CLI

In a kikx project, pass the path or URL where you'd normally pass a built-in reference:

```bash
kikx add ./registry-item.json --name web \
  --set 'data={"LOG_LEVEL": "info", "WORKERS": "4"}' \
  --label tier=frontend
```

This writes `web-configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: web
  namespace: default
  labels:
    app: web
    tier: frontend
immutable: false
data:
  LOG_LEVEL: "info"
  WORKERS: "4"
```

From a URL:

```bash
kikx add https://example.com/kikx/configmap/registry-item.json --name web --set 'data={"LOG_LEVEL": "info"}'
```

If a required field is missing, you get `--data is required for k8s/configmap`. Supply it with `--set data=...`.

Point at the `.json` file itself. kikx checks the built-ins first by the last segment of the reference, so a reference ending in a built-in name, such as `.../deployment`, renders the built-in Deployment instead.

## 3. Or render it in the dashboard

1. In **Build**, pick **From registry URL** under the Custom stage.
2. Paste a URL or a path into **URL or path to a registry-item.json** and click **Load**.
3. Fill in **Name** and the item's fields. Required fields are marked with `*`. Type JSON for list or map fields.
4. Click **Preview** to check the output, then click **Add to project**.

The backend loads the item, not the browser. That means:

- a local path must exist on the machine running the backend. A relative path is resolved from the directory the backend was started in, so prefer an absolute path;
- a URL must be reachable from the backend.

To change a custom component later, open it, load the same item again, and add it with the same **Name**. The field values aren't filled back in, so type them again. The conflict dialog then offers to replace the old one.

## Share it

A preset stores the reference exactly as you typed it. `kikx setup`, `kikx apply` and **Open a preset** all load the item again from there. For a preset other people will use, host the item at a URL rather than a local path.

## See also

- [Registry item format](../reference/registry-item-format.md)
- [The registry as single source of truth](../explanation/registry.md)
- [How rendering works](../explanation/rendering.md)
