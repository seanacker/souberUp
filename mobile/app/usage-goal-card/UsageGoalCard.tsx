import {View, Text, Pressable} from 'react-native';
import {UsageSlider} from './usage-goal-setter/UsageSlider';
import {Icon} from '@rneui/themed';

type UsageGoalCardProps = {
  usageGoal: number;
  setUsageGoal: (usageGoal: number) => void;
  onSaveUsageGoal: (usageGoal: number) => void;
}

export const UsageGoalCard = ({usageGoal, setUsageGoal, onSaveUsageGoal}: UsageGoalCardProps) => {


  return (
    <View
      style={{
        width: '100%',
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={{fontSize: 16, fontWeight: 'bold'}}>Weekly Usage Goal</Text>
        <Pressable
          onPress={() => {
            onSaveUsageGoal(usageGoal);
          }}
          style={{
            padding: 10,
            backgroundColor: 'lightgrey',
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Icon name='save' />
        </Pressable>
      </View>
      <Text style={{fontSize: 20, fontWeight: 'bold', width: '100%', textAlign: 'center', marginTop: 5}}>
        {usageGoal}h
      </Text>
      <UsageSlider setUsageGoal={setUsageGoal} usageGoal={usageGoal} />
    </View>
  );
};
