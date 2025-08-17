import React from 'react';
import styled from 'styled-components';

const NewsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const NewsTitle = styled.h1`
  color: #ffffff;
  margin-bottom: 2rem;
`;

const NewsItem = styled.div`
  background: #1a1a1a;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #333;
`;

const NewsItemTitle = styled.h2`
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const NewsItemContent = styled.p`
  color: #cccccc;
  margin-bottom: 1rem;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const SocialLink = styled.a`
  color: #007bff;
  text-decoration: none;
  font-size: 0.9rem;
  &:hover {
    text-decoration: underline;
  }
`;

const NewsPage: React.FC = () => {
  const newsItems = [
    {
      id: 1,
      title: "WAY ESPORTS Announces New Tournament Series",
      content: "Join us for the biggest tournament series of the year with $50,000 in prizes!",
      date: "2024-01-15"
    },
    {
      id: 2,
      title: "New Partnership with Global Gaming Brands",
      content: "We're excited to announce partnerships with leading gaming companies to bring you exclusive content.",
      date: "2024-01-14"
    },
    {
      id: 3,
      title: "Community Spotlight: Top Players of the Month",
      content: "Meet the top performers who dominated the leaderboards this month!",
      date: "2024-01-13"
    }
  ];

  return (
    <NewsContainer>
      <NewsTitle>Latest News</NewsTitle>
      {newsItems.map(item => (
        <NewsItem key={item.id}>
          <NewsItemTitle>{item.title}</NewsItemTitle>
          <NewsItemContent>{item.content}</NewsItemContent>
          <SocialLinks>
            <SocialLink href="https://www.wayesports.org/" target="_blank">Website</SocialLink>
            <SocialLink href="https://t.me/wayesports" target="_blank">Telegram</SocialLink>
            <SocialLink href="https://discord.gg/wayesports" target="_blank">Discord</SocialLink>
            <SocialLink href="https://www.twitch.tv/WAY_Esports" target="_blank">Twitch</SocialLink>
          </SocialLinks>
        </NewsItem>
      ))}
    </NewsContainer>
  );
};

export default NewsPage;
