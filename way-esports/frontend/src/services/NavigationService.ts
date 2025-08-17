import { NavigateFunction } from 'react-router-dom';

export interface NavigationOptions {
  openInNewTab?: boolean;
  preserveQuery?: boolean;
  state?: Record<string, any>;
  title?: string;
}

export interface BreadcrumbItem {
  path: string;
  title: string;
  timestamp: number;
}

export interface NavigationHistoryItem extends BreadcrumbItem {
  game?: string;
  category?: string;
}

class NavigationService {
  private navigate: NavigateFunction | null = null;
  private navigationHistory: NavigationHistoryItem[] = [];
  private maxHistoryItems = 10;

  setNavigate(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  private addToHistory(path: string, options: NavigationOptions = {}) {
    const { title, state } = options;
    const historyItem: NavigationHistoryItem = {
      path,
      title: title || this.generateTitleFromPath(path),
      timestamp: Date.now(),
      game: state?.game,
      category: state?.category
    };

    this.navigationHistory = [
      historyItem,
      ...this.navigationHistory.slice(0, this.maxHistoryItems - 1)
    ];
  }

  private generateTitleFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return 'Home';

    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getNavigationHistory(): NavigationHistoryItem[] {
    return this.navigationHistory;
  }

  getBreadcrumbs(): BreadcrumbItem[] {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    
    const breadcrumbs: BreadcrumbItem[] = [
      { path: '/', title: 'Home', timestamp: Date.now() }
    ];

    let currentPath2 = '';
    segments.forEach(segment => {
      currentPath2 += `/${segment}`;
      breadcrumbs.push({
        path: currentPath2,
        title: this.generateTitleFromPath(segment),
        timestamp: Date.now()
      });
    });

    return breadcrumbs;
  }

  private handleNavigation(path: string, options: NavigationOptions = {}) {
    const { openInNewTab, preserveQuery, state, title } = options;

    if (openInNewTab) {
      window.open(path, '_blank');
      return;
    }

    if (!this.navigate) {
      window.location.href = path;
      return;
    }

    if (preserveQuery) {
      const currentQuery = window.location.search;
      path = `${path}${currentQuery}`;
    }

    // Add to navigation history before navigating
    this.addToHistory(path, { title, state });
    this.navigate(path, { state });
  }

  // Tournament Navigation
  goToTournaments(filters?: { game?: string; skill?: string }) {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    const title = filters?.game ? `${filters.game} Tournaments` : 'Tournaments';
    this.handleNavigation(`/tournaments${query}`, { 
      title,
      state: { game: filters?.game, category: 'tournaments' }
    });
  }

  goToTournamentDetails(tournamentId: string, title?: string) {
    this.handleNavigation(`/tournaments/${tournamentId}`, { 
      title: title || `Tournament Details`,
      state: { category: 'tournaments' }
    });
  }

  goToCreateTournament() {
    this.handleNavigation('/tournaments/create', { 
      title: 'Create Tournament',
      state: { category: 'tournaments' }
    });
  }

  // Team Navigation
  goToTeams(filters?: { game?: string; recruiting?: boolean }) {
    const queryParams: Record<string, string> = {};
    if (filters?.game) queryParams.game = filters.game;
    if (filters?.recruiting !== undefined) queryParams.recruiting = filters.recruiting.toString();
    
    const query = Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : '';
    const title = filters?.game ? `${filters.game} Teams` : 'Teams';
    this.handleNavigation(`/teams${query}`, {
      title,
      state: { game: filters?.game, category: 'teams' }
    });
  }

  goToTeamDetails(teamId: string, teamName?: string) {
    this.handleNavigation(`/teams/${teamId}`, {
      title: teamName || 'Team Details',
      state: { category: 'teams' }
    });
  }

  goToCreateTeam() {
    this.handleNavigation('/teams/create', {
      title: 'Create Team',
      state: { category: 'teams' }
    });
  }

  goToTeamPractice(teamId: string, teamName?: string) {
    this.handleNavigation(`/teams/${teamId}/practice`, {
      title: `${teamName || 'Team'} Practice`,
      state: { category: 'practice' }
    });
  }

  // Profile Navigation
  goToProfile(username?: string) {
    this.handleNavigation(username ? `/profile/${username}` : '/profile', {
      title: username ? `${username}'s Profile` : 'My Profile',
      state: { category: 'profile' }
    });
  }

  goToProfileEdit() {
    this.handleNavigation('/profile/edit', {
      title: 'Edit Profile',
      state: { category: 'profile' }
    });
  }

  goToProfileSettings() {
    this.handleNavigation('/profile/settings', {
      title: 'Profile Settings',
      state: { category: 'profile' }
    });
  }

  goToAvailability() {
    this.handleNavigation('/profile/availability', {
      title: 'Set Availability',
      state: { category: 'profile' }
    });
  }

  // Game Navigation
  goToGameHub(game: 'CS2' | 'CriticalOps' | 'PUBG' | 'ValorantMobile') {
    this.handleNavigation(`/games/${game.toLowerCase()}`, {
      title: `${game === 'ValorantMobile' ? 'Valorant Mobile' : game} Hub`,
      state: { game, category: 'games' }
    });
  }

  goToGameStats(game: string, username?: string) {
    const path = username ? `/games/${game}/stats/${username}` : `/games/${game}/stats`;
    this.handleNavigation(path, {
      title: username ? `${username}'s ${game} Stats` : `${game} Stats`,
      state: { game, category: 'games' }
    });
  }

  // Community Navigation
  goToDiscord(options?: NavigationOptions) {
    this.handleNavigation('https://discord.gg/way-esports', { 
      openInNewTab: true,
      title: 'WAY Esports Discord',
      ...options
    });
  }

  goToCommunityHub() {
    this.handleNavigation('/community', {
      title: 'Community Hub',
      state: { category: 'community' }
    });
  }

  goToLeaderboards(game?: string) {
    const path = game ? `/leaderboards/${game}` : '/leaderboards';
    this.handleNavigation(path, {
      title: game ? `${game} Leaderboards` : 'Leaderboards',
      state: { game, category: 'leaderboards' }
    });
  }

  // Wallet & Subscription
  goToWallet() {
    this.handleNavigation('/wallet', {
      title: 'Wallet',
      state: { category: 'wallet' }
    });
  }

  goToSubscription() {
    this.handleNavigation('/subscription', {
      title: 'Subscription',
      state: { category: 'subscription' }
    });
  }

  // Dashboard & Home
  goToDashboard() {
    this.handleNavigation('/dashboard', {
      title: 'Dashboard',
      state: { category: 'dashboard' }
    });
  }

  goToHome() {
    this.handleNavigation('/', {
      title: 'Home'
    });
  }

  // Practice & Training
  goToPracticeHub(game?: string) {
    const path = game ? `/practice/${game}` : '/practice';
    this.handleNavigation(path, {
      title: game ? `${game} Practice` : 'Practice Hub',
      state: { game, category: 'practice' }
    });
  }

  goToTrainingRoom(roomId: string, roomName?: string) {
    this.handleNavigation(`/practice/room/${roomId}`, {
      title: roomName ? `Training: ${roomName}` : 'Training Room',
      state: { category: 'practice' }
    });
  }

  // News & Updates
  goToNews(category?: string) {
    const path = category ? `/news/${category}` : '/news';
    this.handleNavigation(path, {
      title: category ? `${category} News` : 'News',
      state: { category: 'news' }
    });
  }

  // Authentication
  goToLogin(returnUrl?: string) {
    const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    this.handleNavigation(`/login${query}`, {
      title: 'Login',
      state: { category: 'auth' }
    });
  }

  goToRegister() {
    this.handleNavigation('/register', {
      title: 'Register',
      state: { category: 'auth' }
    });
  }

  // Error & Special Pages
  goTo404() {
    this.handleNavigation('/404', {
      title: 'Page Not Found'
    });
  }

  goToMaintenance() {
    this.handleNavigation('/maintenance', {
      title: 'Maintenance'
    });
  }

  // Navigation History Methods
  goBack() {
    if (this.navigationHistory.length > 1) {
      const previousPage = this.navigationHistory[1];
      this.handleNavigation(previousPage.path, {
        title: previousPage.title,
        state: {
          game: previousPage.game,
          category: previousPage.category
        }
      });
    } else {
      this.goToHome();
    }
  }

  clearHistory() {
    this.navigationHistory = [];
  }
}

export const navigationService = new NavigationService();
export default navigationService; 