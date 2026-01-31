
import { CommunityPost, UserProfile, LeaderboardEntry, MarketplaceItem, RecyclingRecommendation, Badge, Comment, PurchasedItem } from '../types';

const STORAGE_KEY_USER = 'didaur_current_user_v3';
const STORAGE_KEY_POSTS = 'didaur_posts_v3';
const STORAGE_KEY_ACCOUNTS = 'didaur_accounts_v3';
const STORAGE_KEY_MARKET = 'didaur_market_v3';
const STORAGE_KEY_THEME = 'didaur_theme_v3';
const STORAGE_KEY_SCAN_HISTORY = 'didaur_scans_v3';
const STORAGE_KEY_COMMENTS = 'didaur_comments_v3';

export const BADGES: Badge[] = [
  { id: 'b1', name: 'Pejuang Pertama', icon: '🌱', description: 'Melakukan scan barang pertama kali.', requirement: 'scan_1', unlocked: false },
  { id: 'b2', name: 'Master Plastik', icon: '🥤', description: 'Scan 10 barang berbahan plastik.', requirement: 'scan_plastic_10', unlocked: false },
  { id: 'b3', name: 'Dermawan Kreatif', icon: '🎨', description: 'Membagikan 5 hasil karya ke komunitas.', requirement: 'share_5', unlocked: false },
  { id: 'b4', name: 'Kolektor Seni', icon: '💎', description: 'Membeli item pertama di pasar.', requirement: 'buy_1', unlocked: false },
  { id: 'b5', name: 'Legenda Hijau', icon: '👑', description: 'Mencapai total 5000 XP.', requirement: 'xp_5000', unlocked: false },
  { id: 'b6', name: 'Kolaborator Komunitas', icon: '💬', description: 'Berikan 5 komentar pada karya orang lain.', requirement: 'comment_5', unlocked: false },
  { id: 'b7', name: 'Peduli Lingkungan', icon: '🌍', description: 'Menghemat total 10kg (10.000g) CO2.', requirement: 'co2_10000', unlocked: false },
];

const DUMMY_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    userName: 'Budi Kreatif',
    userAvatar: 'https://i.pravatar.cc/150?u=budi',
    itemName: 'Lampu Hias Botol Plastik',
    description: 'Mengubah botol bekas minuman menjadi lampu hias kamar yang estetik.',
    imageUrl: 'https://images.unsplash.com/photo-1576675784432-994941412b3d?q=80&w=800&auto=format&fit=crop',
    likes: 42,
    comments: 5,
    timestamp: Date.now() - 3600000,
    pointsEarned: 250,
    materialTag: 'Plastik',
    isForSale: true,
    price: 1500
  },
  {
    id: 'p2',
    userName: 'Siti Eco',
    userAvatar: 'https://i.pravatar.cc/150?u=siti',
    itemName: 'Organizer Meja Kardus',
    description: 'Kardus sepatu lama sekarang jadi tempat alat tulis yang rapi.',
    imageUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=80&w=800&auto=format&fit=crop',
    likes: 28,
    comments: 2,
    timestamp: Date.now() - 86400000,
    pointsEarned: 200,
    materialTag: 'Kardus'
  },
  {
    id: 'p3',
    userName: 'Agus Glass',
    userAvatar: 'https://i.pravatar.cc/150?u=agus',
    itemName: 'Vas Bunga Minimalis',
    description: 'Botol kaca selai yang dicat ulang untuk dekorasi meja makan.',
    imageUrl: 'https://images.unsplash.com/photo-1581781870027-04212e231e96?q=80&w=800&auto=format&fit=crop',
    likes: 56,
    comments: 8,
    timestamp: Date.now() - 172800000,
    pointsEarned: 300,
    materialTag: 'Kaca',
    isForSale: true,
    price: 2500
  }
];

const DUMMY_MARKET: MarketplaceItem[] = DUMMY_POSTS.filter(p => p.isForSale).map(p => ({
  id: p.id,
  sellerName: p.userName,
  sellerAvatar: p.userAvatar,
  title: p.itemName,
  description: p.description,
  price: p.price || 1000,
  imageUrl: p.imageUrl,
  materialTag: p.materialTag,
  timestamp: p.timestamp
}));

// Initialize storage with dummy data if empty
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY_POSTS)) {
    localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(DUMMY_POSTS));
  }
  if (!localStorage.getItem(STORAGE_KEY_MARKET)) {
    localStorage.setItem(STORAGE_KEY_MARKET, JSON.stringify(DUMMY_MARKET));
  }
};

initializeStorage();

export const getScanHistory = (): RecyclingRecommendation[] => {
  const stored = localStorage.getItem(STORAGE_KEY_SCAN_HISTORY);
  return stored ? JSON.parse(stored) : [];
};

export const saveScanToHistory = (scan: RecyclingRecommendation) => {
  const history = getScanHistory();
  const newScan = { ...scan, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEY_SCAN_HISTORY, JSON.stringify([newScan, ...history].slice(0, 20)));
};

export const getThemePreference = (): boolean => {
  return localStorage.getItem(STORAGE_KEY_THEME) === 'dark';
};

export const setThemePreference = (isDark: boolean) => {
  localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
};

export const getAccounts = (): Record<string, UserProfile & { password?: string }> => {
  const stored = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
  return stored ? JSON.parse(stored) : {};
};

export const getCurrentUser = (): UserProfile | null => {
  const stored = localStorage.getItem(STORAGE_KEY_USER);
  return stored ? JSON.parse(stored) : null;
};

export const loginUser = (email: string, pass: string): UserProfile | null => {
  const accounts = getAccounts();
  const account = accounts[email];
  if (account && account.password === pass) {
    const { password, ...userProfile } = account;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userProfile));
    return userProfile as UserProfile;
  }
  return null;
};

export const registerUser = (name: string, email: string, pass: string): UserProfile => {
  const accounts = getAccounts();
  const newUser: UserProfile = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    name,
    points: 1000,
    rank: "Pemula Hijau",
    itemsScanned: 0,
    plasticItemsScanned: 0,
    commentsMade: 0,
    creationsShared: 0,
    totalCo2Saved: 0,
    avatar: `https://picsum.photos/seed/${email}/200/200`,
    badges: [],
    purchasedItems: []
  };
  accounts[email] = { ...newUser, password: pass };
  localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  return newUser;
};

export const resetUserPassword = (email: string, newPass: string): boolean => {
  const accounts = getAccounts();
  if (accounts[email]) {
    accounts[email].password = newPass;
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    return true;
  }
  return false;
};

export const updateAccountInfo = (name: string, avatar: string): UserProfile | null => {
  const user = getCurrentUser();
  if (!user) return null;
  user.name = name;
  user.avatar = avatar;
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  const accounts = getAccounts();
  if (accounts[user.email]) {
    accounts[user.email] = { ...accounts[user.email], ...user };
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  }
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEY_USER);
};

export const getCommunityPosts = (): CommunityPost[] => {
  const stored = localStorage.getItem(STORAGE_KEY_POSTS);
  return stored ? JSON.parse(stored) : [];
};

export const saveCommunityPost = (post: CommunityPost) => {
  const posts = getCommunityPosts();
  const updated = [post, ...posts];
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(updated));
  
  if (post.isForSale && post.price) {
    const marketItems = getMarketItems();
    const newItem: MarketplaceItem = {
      id: post.id,
      sellerName: post.userName,
      sellerAvatar: post.userAvatar,
      title: post.itemName,
      description: post.description,
      price: post.price,
      imageUrl: post.imageUrl,
      materialTag: post.materialTag,
      timestamp: post.timestamp
    };
    localStorage.setItem(STORAGE_KEY_MARKET, JSON.stringify([newItem, ...marketItems]));
  }
};

export const updatePostLikes = (postId: string) => {
  const posts = getCommunityPosts();
  const updated = posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p);
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(updated));
};

export const getPostComments = (postId: string): Comment[] => {
  const allComments = JSON.parse(localStorage.getItem(STORAGE_KEY_COMMENTS) || '{}');
  return allComments[postId] || [];
};

export const savePostComment = (postId: string, comment: Comment): UserProfile | null => {
  const allComments = JSON.parse(localStorage.getItem(STORAGE_KEY_COMMENTS) || '{}');
  if (!allComments[postId]) allComments[postId] = [];
  allComments[postId].push(comment);
  localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(allComments));

  // Update post comment count
  const posts = getCommunityPosts();
  const updatedPosts = posts.map(p => p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p);
  localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(updatedPosts));

  // Update user stats
  const user = getCurrentUser();
  if (user) {
    user.commentsMade = (user.commentsMade || 0) + 1;
    // Badge logic: b6
    if (user.commentsMade >= 5 && !user.badges.includes('b6')) {
      user.badges.push('b6');
    }
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    const accounts = getAccounts();
    if (accounts[user.email]) {
      accounts[user.email] = { ...accounts[user.email], ...user };
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    }
    return user;
  }
  return null;
};

export const getMarketItems = (): MarketplaceItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY_MARKET);
  return stored ? JSON.parse(stored) : [];
};

export const purchaseMarketItem = (itemId: string, price: number): { success: boolean, message: string, updatedUser?: UserProfile } => {
  const user = getCurrentUser();
  if (!user) return { success: false, message: 'Silakan masuk terlebih dahulu.' };
  
  if (user.points < price) {
    return { success: false, message: 'Poin (XP) tidak mencukupi untuk membeli karya ini.' };
  }

  const marketItems = getMarketItems();
  const item = marketItems.find(i => i.id === itemId);
  if (!item) return { success: false, message: 'Item tidak ditemukan.' };

  user.points -= price;
  
  // Update purchase history
  if (!user.purchasedItems) user.purchasedItems = [];
  user.purchasedItems.push({
    id: item.id,
    title: item.title,
    price: item.price,
    imageUrl: item.imageUrl,
    purchaseDate: Date.now()
  });
  
  // Badge logic: buy_1
  if (!user.badges.includes('b4')) {
    user.badges.push('b4');
  }

  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  
  const accounts = getAccounts();
  if (accounts[user.email]) {
    accounts[user.email] = { ...accounts[user.email], ...user };
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  }

  const updatedMarket = marketItems.filter(item => item.id !== itemId);
  localStorage.setItem(STORAGE_KEY_MARKET, JSON.stringify(updatedMarket));

  return { success: true, message: 'Pembelian berhasil! Karya ini kini milikmu.', updatedUser: user };
};

export const updateUserPoints = (pointsToAdd: number, co2ToAdd: number = 0, isScan: boolean = true, materialType?: string) => {
  const user = getCurrentUser();
  if (!user) return null;
  
  user.points += pointsToAdd;
  user.totalCo2Saved += co2ToAdd;
  if (isScan) {
    user.itemsScanned += 1;
    if (materialType?.toLowerCase().includes('plastik')) {
      user.plasticItemsScanned = (user.plasticItemsScanned || 0) + 1;
    }
  } else {
    user.creationsShared += 1;
  }
  
  // Badge logic
  if (isScan && user.itemsScanned >= 1 && !user.badges.includes('b1')) user.badges.push('b1');
  if (isScan && (user.plasticItemsScanned || 0) >= 10 && !user.badges.includes('b2')) user.badges.push('b2');
  if (!isScan && user.creationsShared >= 5 && !user.badges.includes('b3')) user.badges.push('b3');
  if (user.points >= 5000 && !user.badges.includes('b5')) user.badges.push('b5');
  if (user.totalCo2Saved >= 10000 && !user.badges.includes('b7')) user.badges.push('b7');

  if (user.points > 5000) user.rank = "Legenda Lingkungan";
  else if (user.points > 2000) user.rank = "Pahlawan Hijau";
  else if (user.points > 1000) user.rank = "Pejuang Ekosistem";

  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  
  const accounts = getAccounts();
  if (accounts[user.email]) {
    accounts[user.email] = { ...accounts[user.email], ...user };
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  }
  
  return user;
};

export const getLeaderboard = (): LeaderboardEntry[] => {
  const base = [
    { id: 'l1', name: 'Andi Green', points: 8450, avatar: 'https://picsum.photos/seed/1/100/100', rank: 0 },
    { id: 'l2', name: 'Rina Eco', points: 7200, avatar: 'https://picsum.photos/seed/2/100/100', rank: 0 },
    { id: 'l3', name: 'Zaki Waste', points: 5100, avatar: 'https://picsum.photos/seed/3/100/100', rank: 0 }
  ];
  const user = getCurrentUser();
  if (user) {
    base.push({ id: user.id, name: user.name, points: user.points, avatar: user.avatar, rank: 0 });
  }
  return base.sort((a, b) => b.points - a.points).map((p, i) => ({ ...p, rank: i + 1 }));
};
