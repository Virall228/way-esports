import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNotifications } from '../../contexts/NotificationContext';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 2px solid #ff6b00;
`;

const NewsHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Title = styled.h1`
  color: #ffffff;
  margin: 0;
  font-size: 32px;
  background: linear-gradient(135deg, #ff6b00, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 300px;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px 16px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }

  &::placeholder {
    color: #888888;
  }
`;

const FilterSelect = styled.select`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px 16px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }

  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #ff6b00, #ff8533);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4);
  }
`;

const NewsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const NewsCard = styled.div<{ $featured?: boolean }>`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${({ $featured }) => $featured ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 107, 0, 0.2)'};
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    border-color: ${({ $featured }) => $featured ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 107, 0, 0.4)'};
  }

  ${({ $featured }) => $featured && `
    grid-column: span 2;
    
    @media (max-width: 768px) {
      grid-column: span 1;
    }
  `}
`;

const NewsImage = styled.div<{ $imageUrl?: string }>`
  height: 200px;
  background: ${({ $imageUrl }) => $imageUrl ? `url(${$imageUrl})` : 'linear-gradient(135deg, #ff6b00, #ff8533)'};
  background-size: cover;
  background-position: center;
  position: relative;
`;

const FeaturedBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #000000;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const NewsContent = styled.div`
  padding: 20px;
`;

const NewsTitle = styled.h3`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  line-height: 1.4;
`;

const NewsExcerpt = styled.p`
  color: #cccccc;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NewsMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #888888;
  font-size: 12px;
`;

const NewsTags = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const Tag = styled.span`
  background: rgba(255, 107, 0, 0.2);
  color: #ff6b00;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
`;

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${({ $isOpen }) => $isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border-radius: 16px;
  padding: 32px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid #ff6b00;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
`;

const Input = styled.input`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const TextArea = styled.textarea`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid rgba(255, 107, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${({ $variant }) => 
    $variant === 'danger' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    $variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
    'linear-gradient(135deg, #ff6b00, #ff8533)'};
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888888;

  h3 {
    color: #ffffff;
    margin-bottom: 12px;
  }
`;

// Social Media Styles
const SocialMediaSection = styled.div`
  margin-bottom: 24px;
  text-align: center;
  padding: 16px;
`;

const SocialIconsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const SocialIcon = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background: rgba(42, 42, 42, 0.5);
  border: 1px solid rgba(255, 0, 0, 0.2);
  transition: all 0.3s ease;
  text-decoration: none;
  color: #ffffff;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 0, 0, 0.2);
    border-color: rgba(255, 0, 0, 0.4);
    background: rgba(42, 42, 42, 0.8);
  }
`;

const DiscordIcon = styled.div`
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #5865f2, #7289da);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #ffffff;
  
  &::before {
    content: '💬';
  }
`;

const TelegramIcon = styled.div`
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #0088cc, #229ed9);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #ffffff;
  
  &::before {
    content: '✈️';
  }
`;

const WebsiteIcon = styled.div`
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #ff0000, #ff69b4);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #ffffff;
  
  &::before {
    content: '🌐';
  }
`;

const TwitchIcon = styled.div`
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #9146ff, #a970ff);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #ffffff;
  
  &::before {
    content: '🎥';
  }
`;

const ProgressBar = styled.div`
  width: 100px;
  height: 8px;
  background: rgba(128, 128, 128, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
`;

const ProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ff8533);
  width: ${({ $percentage }) => Math.min($percentage, 100)}%;
  transition: width 0.3s ease;
`;

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  imageUrl?: string;
  author: string;
  tags: string[];
  category: string;
  featured: boolean;
  publishedAt: string;
  status: 'draft' | 'published' | 'archived';
}

const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { addNotification } = useNotifications();

  // Mock data - в реальном приложении это будет загружаться с сервера
  useEffect(() => {
    const mockArticles: NewsArticle[] = [
      {
        id: '1',
        title: 'WAY Esports Announces Major Tournament Series',
        content: 'We are excited to announce our biggest tournament series yet...',
        excerpt: 'WAY Esports is launching a comprehensive tournament series featuring multiple games and substantial prize pools.',
        imageUrl: '/images/tournament-announcement.jpg',
        author: 'Admin',
        tags: ['tournaments', 'announcement', 'esports'],
        category: 'tournaments',
        featured: true,
        publishedAt: '2024-01-15T10:00:00Z',
        status: 'published'
      },
      {
        id: '2',
        title: 'New Team Joins WAY Esports',
        content: 'We welcome our newest team to the WAY Esports family...',
        excerpt: 'A talented new team has joined our organization, bringing fresh energy and skills.',
        imageUrl: '/images/new-team.jpg',
        author: 'Admin',
        tags: ['teams', 'recruitment', 'esports'],
        category: 'teams',
        featured: false,
        publishedAt: '2024-01-14T15:30:00Z',
        status: 'published'
      },
      {
        id: '3',
        title: 'Valorant Mobile Tournament Results',
        content: 'The latest Valorant Mobile tournament has concluded with exciting results...',
        excerpt: 'Check out the results and highlights from our recent Valorant Mobile tournament.',
        imageUrl: '/images/valorant-results.jpg',
        author: 'Admin',
        tags: ['valorant', 'results', 'tournament'],
        category: 'results',
        featured: false,
        publishedAt: '2024-01-13T20:00:00Z',
        status: 'published'
      }
    ];

    setArticles(mockArticles);
    setFilteredArticles(mockArticles);
  }, []);

  // Filter articles based on search and category
  useEffect(() => {
    let filtered = articles;

    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedCategory]);

  const handleCreateArticle = () => {
    setEditingArticle(null);
    setIsModalOpen(true);
  };

  const handleEditArticle = (article: NewsArticle) => {
    setEditingArticle(article);
    setIsModalOpen(true);
  };

  const handleDeleteArticle = (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      setArticles(prev => prev.filter(article => article.id !== id));
      addNotification({
        type: 'success',
        title: 'Article Deleted',
        message: 'The article has been successfully deleted.'
      });
    }
  };

  const handleSaveArticle = (formData: any) => {
    if (editingArticle) {
      // Update existing article
      setArticles(prev => prev.map(article =>
        article.id === editingArticle.id
          ? { ...article, ...formData, id: article.id }
          : article
      ));
      addNotification({
        type: 'success',
        title: 'Article Updated',
        message: 'The article has been successfully updated.'
      });
    } else {
      // Create new article
      const newArticle: NewsArticle = {
        ...formData,
        id: Date.now().toString(),
        publishedAt: new Date().toISOString(),
        status: 'published'
      };
      setArticles(prev => [newArticle, ...prev]);
      addNotification({
        type: 'success',
        title: 'Article Created',
        message: 'The article has been successfully created.'
      });
    }
    setIsModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container>
      <Header>
        <NewsHeaderRow>
          <img src="/images/news1.jpg.jpg" alt="News" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
          <Title>News & Updates</Title>
        </NewsHeaderRow>
        <p style={{ color: '#cccccc', margin: '8px 0 0 0' }}>
          Stay updated with the latest news, tournament announcements, and team updates
        </p>
      </Header>

      {/* Social Media Icons */}
      <SocialMediaSection>
        <SocialIconsContainer>
          <SocialIcon href="https://discord.gg/wayesports" target="_blank" rel="noopener noreferrer">
            <DiscordIcon />
          </SocialIcon>
          <SocialIcon href="https://t.me/wayesports" target="_blank" rel="noopener noreferrer">
            <TelegramIcon />
          </SocialIcon>
          <SocialIcon href="https://wayesports.com" target="_blank" rel="noopener noreferrer">
            <WebsiteIcon />
          </SocialIcon>
          <SocialIcon href="https://twitch.tv/wayesports" target="_blank" rel="noopener noreferrer">
            <TwitchIcon />
          </SocialIcon>
        </SocialIconsContainer>
      </SocialMediaSection>

      <SearchBar>
        <SearchInput
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FilterSelect
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="tournaments">Tournaments</option>
          <option value="teams">Teams</option>
          <option value="results">Results</option>
          <option value="announcements">Announcements</option>
        </FilterSelect>
        {isAdmin && (
          <CreateButton onClick={handleCreateArticle}>
            Create Article
          </CreateButton>
        )}
      </SearchBar>

      {filteredArticles.length === 0 ? (
        <EmptyState>
          <h3>No articles found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </EmptyState>
      ) : (
        <NewsGrid>
          {filteredArticles.map(article => (
            <NewsCard key={article.id} $featured={article.featured}>
              <NewsImage $imageUrl={article.imageUrl}>
                {article.featured && <FeaturedBadge>Featured</FeaturedBadge>}
              </NewsImage>
              <NewsContent>
                <NewsTitle>{article.title}</NewsTitle>
                <NewsExcerpt>{article.excerpt}</NewsExcerpt>
                <NewsTags>
                  {article.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </NewsTags>
                <NewsMeta>
                  <span>By {article.author}</span>
                  <span>{formatDate(article.publishedAt)}</span>
                </NewsMeta>
                {isAdmin && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <Button $variant="secondary" onClick={() => handleEditArticle(article)}>
                      Edit
                    </Button>
                    <Button $variant="danger" onClick={() => handleDeleteArticle(article.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </NewsContent>
            </NewsCard>
          ))}
        </NewsGrid>
      )}

      <Modal $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <h2 style={{ color: '#ffffff', marginBottom: '24px' }}>
            {editingArticle ? 'Edit Article' : 'Create New Article'}
          </h2>
          <Form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSaveArticle({
              title: formData.get('title'),
              content: formData.get('content'),
              excerpt: formData.get('excerpt'),
              imageUrl: formData.get('imageUrl'),
              category: formData.get('category'),
              tags: formData.get('tags')?.toString().split(',').map(tag => tag.trim()) || [],
              featured: formData.get('featured') === 'on',
              author: 'Admin'
            });
          }}>
            <FormGroup>
              <Label>Title</Label>
              <Input
                name="title"
                defaultValue={editingArticle?.title}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Excerpt</Label>
              <TextArea
                name="excerpt"
                defaultValue={editingArticle?.excerpt}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Content</Label>
              <TextArea
                name="content"
                defaultValue={editingArticle?.content}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Image URL</Label>
              <Input
                name="imageUrl"
                defaultValue={editingArticle?.imageUrl}
                type="url"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Category</Label>
              <FilterSelect name="category" defaultValue={editingArticle?.category || 'announcements'}>
                <option value="announcements">Announcements</option>
                <option value="tournaments">Tournaments</option>
                <option value="teams">Teams</option>
                <option value="results">Results</option>
              </FilterSelect>
            </FormGroup>
            
            <FormGroup>
              <Label>Tags (comma-separated)</Label>
              <Input
                name="tags"
                defaultValue={editingArticle?.tags.join(', ')}
                placeholder="esports, tournament, announcement"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={editingArticle?.featured}
                />
                Featured Article
              </Label>
            </FormGroup>
            
            <ButtonGroup>
              <Button type="submit">
                {editingArticle ? 'Update Article' : 'Create Article'}
              </Button>
              <Button type="button" $variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default NewsPage; 