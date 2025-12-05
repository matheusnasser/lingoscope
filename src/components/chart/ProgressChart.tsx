import { View, Text, Dimensions } from "react-native";
import { CapturedImage } from "../../services/storage/storageService";

interface ProgressChartProps {
  posts: CapturedImage[];
}

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 48; // padding
const CHART_HEIGHT = 200;
const BAR_GAP = 4;

export default function ProgressChart({ posts }: ProgressChartProps) {
  // Group posts by date (last 7 days)
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const last7Days = getLast7Days();
  
  const postsByDate = last7Days.map((date) => {
    const dateStr = date.toISOString().split('T')[0];
    const count = posts.filter((post) => {
      if (!post.created_at) return false;
      const postDate = new Date(post.created_at).toISOString().split('T')[0];
      return postDate === dateStr;
    }).length;
    return { date, count };
  });

  const maxCount = Math.max(...postsByDate.map((d) => d.count), 1);

  const getDayLabel = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <View className="bg-white rounded-xl p-6 shadow-sm border border-coolGray/20">
      <Text className="text-nightshade font-bold text-lg mb-4">
        Learning Progress (Last 7 Days)
      </Text>
      
      <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH }}>
        {/* Chart Bars */}
        <View className="flex-row items-end justify-between h-full">
          {postsByDate.map((item, index) => {
            const barHeight = (item.count / maxCount) * (CHART_HEIGHT - 40);
            return (
              <View key={index} className="items-center flex-1">
                <View
                  className="bg-vibrantCoral rounded-t-lg"
                  style={{
                    width: (CHART_WIDTH / 7) - BAR_GAP,
                    height: Math.max(barHeight, 4),
                    marginBottom: 8,
                  }}
                />
                <Text className="text-coolGray text-xs mt-2">
                  {getDayLabel(item.date)}
                </Text>
                <Text className="text-nightshade text-xs font-semibold mt-1">
                  {item.count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}








