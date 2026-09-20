export interface DeploymentState {
  candidateCommit: string;
  currentCommit: string;
  contentRevision: string;
  approvedRevision: string;
  preview: boolean;
}

export function validateDeployment(state: DeploymentState): void {
  if (state.preview) throw new Error('A preview artifact cannot be published');
  if (state.candidateCommit !== state.currentCommit)
    throw new Error('Obsolete deployment');
  if (
    !state.approvedRevision ||
    state.contentRevision !== state.approvedRevision
  ) {
    throw new Error('Editorial approval does not match this artifact');
  }
}
