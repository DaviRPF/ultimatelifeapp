import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import GameEngine from '../../services/GameEngine';
import { AppData, Reward, Hero } from '../../types';

type RewardsScreenNavigationProp = StackNavigationProp<any, 'Rewards'>;

interface Props {
  navigation: RewardsScreenNavigationProp;
}

const RewardsScreen: React.FC<Props> = ({ navigation }) => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [hero, setHero] = useState<Hero | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const gameEngine = GameEngine.getInstance();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const data = await gameEngine.getAppData();
      setAppData(data);
      setHero(data.hero);
    } catch (error) {
      console.error('Error loading rewards data:', error);
      Alert.alert('Error', 'Failed to load rewards data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePurchaseReward = async (rewardId: string) => {
    const reward = appData?.rewards.find(r => r.id === rewardId);
    if (!reward || !hero) return;

    Alert.alert(
      'Purchase Reward',
      `Are you sure you want to purchase "${reward.title}" for ${reward.cost} gold?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              const result = await gameEngine.purchaseReward(rewardId);
              
              if (result.success) {
                Alert.alert('Success!', result.message);
                await loadData(); // Refresh data
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('Error purchasing reward:', error);
              Alert.alert('Error', 'Failed to purchase reward');
            }
          }
        }
      ]
    );
  };

  const renderRewardCard = (reward: Reward) => {
    const canAfford = hero && hero.gold >= reward.cost;
    const isPurchased = reward.purchased;
    const isOutOfStock = !reward.hasInfiniteStock && (reward.currentStock ?? 0) <= 0;
    const canPurchase = canAfford && !isPurchased && !isOutOfStock;

    return (
      <View key={reward.id} style={styles.rewardCard}>
        <View style={styles.rewardHeader}>
          <Text style={styles.rewardTitle}>{reward.title}</Text>
          <View style={styles.costContainer}>
            <Text style={styles.goldIcon}>🏆</Text>
            <Text style={[styles.cost, !canAfford && styles.costUnaffordable]}>
              {reward.cost}
            </Text>
          </View>
        </View>

        {reward.description && (
          <Text style={styles.rewardDescription}>{reward.description}</Text>
        )}

        {/* Stock Information */}
        <View style={styles.stockInfo}>
          {reward.hasInfiniteStock ? (
            <Text style={styles.stockText}>♾️ Infinite Stock</Text>
          ) : (
            <Text style={[
              styles.stockText,
              isOutOfStock && styles.outOfStockText
            ]}>
              📦 {reward.currentStock ?? 0} / {reward.totalStock ?? 0} in stock
            </Text>
          )}
          
          {reward.timesPurchased > 0 && (
            <Text style={styles.purchaseCountText}>
              Purchased {reward.timesPurchased} time{reward.timesPurchased !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {isPurchased && reward.totalStock === 1 ? (
          <View style={styles.purchasedContainer}>
            <Text style={styles.purchasedText}>✅ Purchased</Text>
            {reward.timePurchased && (
              <Text style={styles.purchaseDate}>
                {new Date(reward.timePurchased).toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              !canPurchase && styles.purchaseButtonDisabled
            ]}
            onPress={() => handlePurchaseReward(reward.id)}
            disabled={!canPurchase}
          >
            <Text style={[
              styles.purchaseButtonText,
              !canPurchase && styles.purchaseButtonTextDisabled
            ]}>
              {isOutOfStock ? 'Out of Stock' : !canAfford ? 'Not enough gold' : 'Purchase'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const availableRewards = appData?.rewards.filter(r => {
    // Single-purchase rewards that are not purchased yet
    if (!r.hasInfiniteStock && r.totalStock === 1) {
      return !r.purchased;
    }
    // Multi-purchase or infinite stock rewards that still have stock
    return r.hasInfiniteStock || (r.currentStock ?? 0) > 0;
  }) || [];
  
  const purchasedRewards = appData?.rewards.filter(r => {
    // Only show single-purchase rewards that have been purchased
    return r.purchased && !r.hasInfiniteStock && r.totalStock === 1;
  }) || [];

  return (
    <View style={styles.container}>
      {/* Header with gold */}
      <View style={styles.header}>
        <Text style={styles.title}>Reward Shop</Text>
        <View style={styles.goldContainer}>
          <Text style={styles.goldIcon}>🏆</Text>
          <Text style={styles.goldAmount}>{hero?.gold || 0}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateReward')}
        >
          <Text style={styles.createButtonText}>+ Create Reward</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Available Rewards */}
        {availableRewards.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Available Rewards</Text>
            {availableRewards.map(renderRewardCard)}
          </>
        )}

        {/* Purchased Rewards */}
        {purchasedRewards.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Purchased Rewards</Text>
            {purchasedRewards.map(renderRewardCard)}
          </>
        )}

        {/* Empty State */}
        {appData?.rewards.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyText}>No rewards yet</Text>
            <Text style={styles.emptySubtext}>
              Create custom rewards to motivate yourself!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  goldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold + '20',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  goldIcon: {
    fontSize: FontSizes.lg,
    marginRight: Spacing.xs,
  },
  goldAmount: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  actionButtons: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  createButtonText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  rewardCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rewardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold + '20',
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  cost: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  costUnaffordable: {
    color: Colors.danger,
  },
  rewardDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  purchaseButton: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: Colors.surfaceDark,
  },
  purchaseButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  purchaseButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  purchasedContainer: {
    backgroundColor: Colors.success + '20',
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  purchasedText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.success,
  },
  purchaseDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Stock styles
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stockText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  outOfStockText: {
    color: Colors.danger,
    fontWeight: 'bold',
  },
  purchaseCountText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default RewardsScreen;