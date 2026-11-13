import { workspaceAccess } from '../shared/access.mjs';

export async function loadTaskPeople(api, canManageTeam) {
  const [result, team] = await Promise.all([
    api('/task-people'),
    canManageTeam ? api('/team') : null,
  ]);
  const members = new Map((team?.members || []).map((member) => [member.id, member]));
  return result.people.map((person) => {
    const member = members.get(person.id);
    let canEdit;
    if (member) canEdit = workspaceAccess({ ...member, workspace_permission: member.permission }).canEditTasks;
    else if (person.department === 'owner') canEdit = true;
    else if (person.department === 'accounting') canEdit = false;
    return { ...person, can_edit_tasks: canEdit };
  });
}
