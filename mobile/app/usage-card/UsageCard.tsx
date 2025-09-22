import {View, Text, Pressable} from 'react-native';
import {UsageSlider} from './usage-goal-setter/UsageSlider';
import {useCallback, useEffect, useState} from 'react';
import {Icon} from '@rneui/themed';
import { getUsageGoalQuery } from './api/getUsageGoal';
import { setUsageGoalMutation } from './api/setUsageGoal';
import { useGQLMutation, useGQLQuery } from '../hooks/useGQLCLient';

export const UsageCard = () => {
  const [usageGoal, setUsageGoal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const fetchUsageGoal = useGQLQuery<{usageGoal: number}>(getUsageGoalQuery);
  const saveUsageGoal = useGQLMutation(setUsageGoalMutation);


  useEffect(() => {
    setStatus('loading');
    fetchUsageGoal().then((response) => {
      setUsageGoal(response.usageGoal);
      setStatus('success');
    }).catch((error) => {
      console.error(error);
      setStatus('error');
    });
    
  }, [])

  const handleSaveUsageGoal = useCallback((usageGoal: number) => {
    setStatus('loading');
    saveUsageGoal(usageGoal.toString()).then((response) => {
      setStatus('success');
    }).catch((error) => {
      console.error(error);
      setStatus('error');
    });
  }, [saveUsageGoal])

  useEffect(() => {
    handleSaveUsageGoal(usageGoal);
  }, [usageGoal, handleSaveUsageGoal])

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
            console.log('save', usageGoal);
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
