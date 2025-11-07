export interface TeamMember {
  id?: string;
  referenceId?: string;
  isOwner?: boolean;
  status?: string;
  givenName?: string;
  familyName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedLocations?: {
    assignmentType?: string;
    locationIds?: string[];
  };
}

export interface TeamMemberResponse {
  success: boolean;
  teamMember: TeamMember;
}

export interface TeamMemberErrorResponse {
  success: false;
  error: string;
  message: string;
}
