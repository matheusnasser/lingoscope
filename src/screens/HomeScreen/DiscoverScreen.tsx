import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import PokedexGrid from "../../components/pokedex/PokedexGrid";
import SearchBar from "../../components/pokedex/SearchBar";
import { useAuth } from "../../context/AuthContext";
import {
  CapturedImage,
  storageService,
} from "../../services/storage/storageService";

export default function DiscoverScreen() {
  const { session } = useAuth();
  const [posts, setPosts] = React.useState<CapturedImage[]>([]);
  const [filteredPosts, setFilteredPosts] = React.useState<CapturedImage[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch posts when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadPosts = async () => {
        if (session?.user?.id) {
          setIsLoadingPosts(true);
          const userPosts = await storageService.getUserImages(session.user.id);
          setPosts(userPosts);
          setFilteredPosts(userPosts);
          setIsLoadingPosts(false);
        }
      };
      loadPosts();
    }, [session])
  );

  // Filter posts based on search query
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = posts.filter((post) => {
      const target = post.detected_object_target?.toLowerCase() || "";
      const base = post.detected_object_base?.toLowerCase() || "";
      const pinyin = post.detected_object_target_pinyin?.toLowerCase() || "";
      const sentence = post.context_sentence?.toLowerCase() || "";

      return (
        target.includes(query) ||
        base.includes(query) ||
        pinyin.includes(query) ||
        sentence.includes(query)
      );
    });
    setFilteredPosts(filtered);
  }, [searchQuery, posts]);

  return (
    <View className="flex-1 bg-offWhite">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 bg-white border-b border-coolGray/20">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold text-deepTeal mb-1">
              Lingodex
            </Text>
            <Text className="text-coolGray text-sm">
              {posts.length} {posts.length === 1 ? "item" : "items"} collected
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-deepTeal/10 items-center justify-center">
            <Ionicons name="book" size={24} color="#0F4C5C" />
          </View>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />
      </View>

      {/* Pokedex Grid */}
      <View className="flex-1">
        {isLoadingPosts ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="small" color="#0F4C5C" />
            <Text className="text-coolGray text-sm mt-2">
              Loading collection...
            </Text>
          </View>
        ) : (
          <PokedexGrid items={filteredPosts} />
        )}
      </View>
    </View>
  );
}
