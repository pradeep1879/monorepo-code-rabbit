export interface ContributionCalendar {
  totalContributions: number;

  weeks: {
    contributionDays: {
      contributionCount: number;
      date: string;
      color: string;
    }[];
  }[];
}

export interface ContributionResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: ContributionCalendar;
    };
  };
}


export interface Repository {
 id: number | string;
 name: string;
 full_name: string;
 description: string,
 html_url: string,
 stargazers_count: number;
 language: string | null;
 topics: string[];
isConnected?: boolean;
indexingStatus?: "idle" | "pending" | "processing" | "completed" | "failed";
}
