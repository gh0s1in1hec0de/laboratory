export enum MarketingSupportTabsValues {
  LOW = 0.5,
  HIGH = 1.5,
}

export interface CreateTokenFormFields {
  // off chain
  // Links
  x: string;
  telegram: string;
  website: string;

  // Metadata
  name: string;
  description: string;
  symbol: string;
  decimals: string; // always 6

  image: string;
  influencerSupport: boolean;

  // on chain
  totalSupply: string;
  marketingSupportEnabled: boolean;
  marketingSupportValue: MarketingSupportTabsValues;
}
