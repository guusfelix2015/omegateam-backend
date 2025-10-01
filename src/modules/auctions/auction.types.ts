import type {
  Auction,
  AuctionItem,
  Bid,
  AuctionStatus,
  AuctionItemStatus,
  BidStatus,
} from '@prisma/client';

// Auction with relations
export interface AuctionWithRelations extends Auction {
  creator: {
    id: string;
    name: string;
    nickname: string;
    avatar: string | null;
  };
  items: AuctionItemWithRelations[];
}

// AuctionItem with relations
export interface AuctionItemWithRelations extends AuctionItem {
  raidDroppedItem: {
    id: string;
    name: string;
    category: string;
    grade: string;
    minDkpBid: number;
    raidInstance: {
      id: string;
      completedAt: Date;
      raid: {
        id: string;
        name: string;
      };
    };
  };
  currentWinner: {
    id: string;
    name: string;
    nickname: string;
    avatar: string | null;
  } | null;
  bids: BidWithRelations[];
}

// Bid with relations
export interface BidWithRelations extends Bid {
  user: {
    id: string;
    name: string;
    nickname: string;
    avatar: string | null;
  };
}

// Create auction data
export interface CreateAuctionData {
  createdBy: string;
  defaultTimerSeconds?: number;
  minBidIncrement?: number;
  notes?: string;
  itemIds: string[]; // Array of RaidDroppedItem IDs
}

// Create bid data
export interface CreateBidData {
  auctionItemId: string;
  userId: string;
  amount: number;
}

// Update auction data
export interface UpdateAuctionData {
  status?: AuctionStatus;
  startedAt?: Date;
  finishedAt?: Date;
  notes?: string;
}

// Update auction item data
export interface UpdateAuctionItemData {
  status?: AuctionItemStatus;
  currentBid?: number;
  currentWinnerId?: string | null;
  timeRemaining?: number | null;
  startedAt?: Date;
  finishedAt?: Date;
}

// Get auctions options
export interface GetAuctionsOptions {
  page: number;
  limit: number;
  status?: AuctionStatus;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  itemName?: string;
  itemCategory?: string;
  itemGrade?: string;
  sortBy: 'createdAt' | 'startedAt' | 'finishedAt';
  sortOrder: 'asc' | 'desc';
}

// Get won items options
export interface GetWonItemsOptions {
  userId: string;
  dateFrom?: Date;
  dateTo?: Date;
  itemCategory?: string;
  itemGrade?: string;
}

// Auction analytics
export interface AuctionAnalytics {
  totalAuctions: number;
  totalItemsSold: number;
  totalItemsNoBids: number;
  totalDkpSpent: number;
  averageDkpPerItem: number;
  averageBidsPerItem: number;
  mostPopularItems: ItemPopularity[];
  topSpenders: TopSpender[];
  categoryDistribution: CategoryDistribution[];
  gradeDistribution: GradeDistribution[];
  auctionTrends: AuctionTrend[];
}

export interface ItemPopularity {
  itemName: string;
  category: string;
  grade: string;
  totalBids: number;
  totalAuctions: number;
  averagePrice: number;
  highestPrice: number;
}

export interface TopSpender {
  userId: string;
  userName: string;
  userNickname: string;
  totalSpent: number;
  itemsWon: number;
  averageSpent: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  totalDkp: number;
  averageDkp: number;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  totalDkp: number;
  averageDkp: number;
}

export interface AuctionTrend {
  date: string;
  auctionsCount: number;
  itemsSold: number;
  totalDkp: number;
}

// Get auction items options
export interface GetAuctionItemsOptions {
  auctionId?: string;
  status?: AuctionItemStatus;
  winnerId?: string;
}

// Get bids options
export interface GetBidsOptions {
  auctionItemId?: string;
  userId?: string;
  status?: BidStatus;
}

// Auction stats
export interface AuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  finishedAuctions: number;
  totalItemsSold: number;
  totalItemsNoBids: number;
  totalDkpSpent: number;
}

// User won items
export interface UserWonItem {
  id: string;
  itemName: string;
  category: string;
  grade: string;
  amountPaid: number;
  wonAt: Date;
  auctionId: string;
  raidName: string;
  raidCompletedAt: Date;
}

