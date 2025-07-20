import React from 'react';
import HLTVStyleStats from './HLTVStyleStats';
import { CriticalOpsMatch } from '../../../utils/criticalOpsStats';

interface MatchStatsProps {
    match: CriticalOpsMatch;
}

const MatchStats: React.FC<MatchStatsProps> = ({ match }) => {
    return <HLTVStyleStats match={match} />;
};

export default MatchStats; 