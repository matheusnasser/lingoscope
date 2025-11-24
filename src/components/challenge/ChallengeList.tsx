import { View } from "react-native";
import ChallengeCard, { Challenge } from "./ChallengeCard";

interface ChallengeListProps {
  challenges: Challenge[];
}

export default function ChallengeList({ challenges }: ChallengeListProps) {
  if (challenges.length === 0) {
    return null;
  }

  return (
    <View>
      {challenges.map((challenge, index) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          currentIndex={index}
          totalChallenges={challenges.length}
        />
      ))}
    </View>
  );
}

