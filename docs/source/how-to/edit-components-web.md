# Edit components in the app

Use this guide to change the components of a project in the app: open one, edit it, save it, add new ones, remove the ones you don't need, and deal with drafts, file conflicts and checks along the way.

On very wide screens the **Project** panel isn't shown next to the editor. Open it with the **Project (N)** button in the header.

## Open and edit a component

1. In the **Project** panel, click the component. The editor title reads **Editing** followed by the component, for example **Editing Inventory · platform**.
2. Change the fields you need. **Preview** shows the rendered files and updates as you type.
3. Click **Save changes**, or press ⌘ + Enter (Ctrl + Enter on Windows and Linux).

A notification says **Saved** followed by the component name. If a field is invalid, the app saves nothing: a notification says **Some fields need attention** and names the first problem, and the field is highlighted in the form.

To throw away what you typed since the last save, click **Discard changes** in the save bar. The button only appears once you've changed something; until then the save bar says **No unsaved changes**.

### Rename a component

Change **Name** and click **Save changes**. The saved component replaces the one you opened, in the same place in the **Project** panel, and its files follow the new name. The old files disappear from the project.

If the new name makes the component write a file another component already writes, the app asks first. See [Handle a file conflict](#handle-a-file-conflict).

## Start a new component

- Click an entry in the stages on the left, for example **Playbook** under **Configure**. Some entries are behind **Show more** at the bottom of a stage. The editor title reads **New playbook**.
- While you're editing a component, click **New** at the top right of the editor to start another component of the same kind.

Fill in the fields and click **Add to project**. A notification says **Added** followed by the name. When there's a usual next step, the notification has a **Next** button, for example **Next: Playbook**, that opens that editor.

On a new component, **Reset** in the save bar puts every field back to its default.

## Remove a component

1. In the **Project** panel, hover the component.
2. Click the bin icon at the end of its row.

The component and all its files leave the project. A notification says **Removed** followed by the name, with an **Undo** button. Click **Undo** to put the component back where it was. Once the notification is gone, the only way back is to add the component again.

## Pick up a draft

The app keeps what you type in the browser, even before you save. While you have unsaved changes, the save bar says **Draft kept in this browser · ⌘/Ctrl + Enter to save**.

If you leave the builder, reload the page, or open another component before saving, nothing is lost. When you come back to the same component, or to the same new-component editor, a line at the top of the editor says **Restored your unsaved draft from** followed by the date. Then either:

- keep editing and save as usual; or
- click **Discard draft** to go back to the saved values.

Each component keeps its own draft, and so does each kind of new component. Drafts are removed when you save, and for the whole project when you open a template or a preset, start a blank project, or discard the project from the home page.

Drafts live only in this browser. Another browser or another computer doesn't see them.

## Handle a file conflict

A project allows one component per file. The app warns you before a save would break that rule.

While you edit, if the rendered files collide with another component, the save bar shows a line such as *Saving replaces `<file>`, currently from `<component>`*. In **Preview**, the colliding files carry a warning icon. The line goes away as soon as your values stop colliding, for example when you change **Name**.

If you save anyway, a dialog opens titled **This file already exists**, or **N files already exist**:

1. Click a file to expand it. **Current** shows what the project has now and **Incoming** what your component would write. The row says **same content** or **content differs**.
2. Under each file, **Currently written by** names the component that owns it.
3. If the dialog has an **Also removed with that component** line, read it. Replacing removes the whole owning component, including files that don't collide.
4. Choose:
   - **Keep existing** closes the dialog and saves nothing. Your edits stay in the form, so you can change **Name** and save again.
   - **Replace** removes the owning component and saves yours. The notification says how many other components were replaced. There's no **Undo** for this.

[Resolve file conflicts and checks](resolve-conflicts.md) covers the CLI side and what to do next.

## Fix check issues from the editor

When you open a component that a check flags, a section at the top of the editor lists the issues, under a heading such as **2 checks flag this component**. Each issue gives its title and a short explanation, plus buttons:

- **Open** followed by a component name opens the other component involved, for example the inventory a play targets;
- **Scaffold N roles** creates empty roles for the roles a playbook uses that the project doesn't have.

Fix the values, save, and the section shrinks or disappears. The **Checks** tab lists the issues of every component at once. See [Resolve file conflicts and checks](resolve-conflicts.md#fix-what-checks-reports) and the [Checks reference](../reference/checks.md).

[Start the Checks lesson](teach:checks) to practise conflicts and checks with the app guiding you.

## See also

- [Start from a template in the app](start-from-template-web.md)
- [Scaffold the roles your playbooks use](scaffold-roles.md)
- [Components](../reference/components.md)
