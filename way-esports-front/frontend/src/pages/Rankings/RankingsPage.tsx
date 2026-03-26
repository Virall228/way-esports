import RankingsPage from '../../components/Rankings/RankingsPage';
import { Seo } from '../../components/SEO';

const RankingsSeoPage = () => (
  <>
    <Seo
      title="Esports Team and Player Rankings | WAY Esports"
      description="Explore live team and player rankings, performance ladders and weekly competitive standings on WAY Esports."
      canonicalPath="/rankings"
      type="website"
      keywords={['esports rankings', 'player rankings', 'team rankings', 'WAY Esports standings']}
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'WAY Esports Rankings',
        description: 'Live team and player rankings on WAY Esports.'
      }}
    />
    <RankingsPage />
  </>
);

export default RankingsSeoPage;
