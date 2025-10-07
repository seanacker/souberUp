import {useState, useEffect, useCallback} from 'react';
import {View, ActivityIndicator, Button, Text, Pressable} from 'react-native';
import {GET_ME} from '../api/queries/getMe';
import {UPSERT_USER_MUTATION} from '../api/mutations/upsertUser';
import {UsageGoalCard} from '../usage-goal-card/UsageGoalCard';
import {UsageProgressCard} from '../components/usage-progress-card/UsageProgressCard';
import {ensureUsageAccess, watchUsageAccess} from '../utils/permissions';
import {useGql} from '../hooks/useGql';
import {getUsageSinceMonday} from '../components/usage-progress-card/getUsageStats';
import {useAuth} from '../auth/AuthContext';
import {Icon} from '@rneui/base';
import {AddContactCard} from '../components/add-contact-card/AddContactCard';
import {User} from '../api/types';

export const Home = () => {
  const {signOut} = useAuth();
  const {call} = useGql();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [usageGoalMinutes, setUsageGoalMinutes] = useState(0);
  const [storedUsageGoalMinutes, setStoredUsageGoalMinutes] = useState(0);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [displayAddContact, setDisplayAddContact] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [contacts, setContacts] = useState<User[]>();

  useEffect(() => {
    let unsubscribe = () => {};
    (async () => {
      console.log('inside effect');
      const ok = await ensureUsageAccess();
      if (ok) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
        unsubscribe = watchUsageAccess(() => setHasAccess(true));
      }
    })();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setStatus('loading');
    call<{me: User}>(GET_ME)
      .then(response => {
        setStoredUsageGoalMinutes(response.me.usageGoalMinutes);

        setUsageGoalMinutes(response.me.usageGoalMinutes);
        setStatus('success');
      })
      .catch(error => {
        console.error(error);
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ok;
    const checkUsageAccess = async () => {
      ok = await ensureUsageAccess();
      if (!ok) {
        watchUsageAccess(async () => {
          getUsageSinceMonday().then(response => {
            setUsageStats(response);
          });
        });
      } else {
        getUsageSinceMonday().then(response => {
          setUsageStats(response);
        });
      }
    };
    checkUsageAccess();
  }, []);

  const onLogout = async () => {
    await signOut();
  };

  const handleSaveUsageGoal = useCallback(() => {
    setStatus('loading');
    call<{updateUser: {usageGoalMinutes: number}}>(UPSERT_USER_MUTATION, {data: {usageGoalMinutes}})
      .then(response => {
        if (response.updateUser.usageGoalMinutes) {
          setStoredUsageGoalMinutes(response.updateUser.usageGoalMinutes);
        }
        setStatus('success');
      })
      .catch(error => {
        console.error(error);
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usageGoalMinutes]);

  const toggleShowAddContactCard = () => setDisplayAddContact(!displayAddContact);

  const addContact = (contact: User) => setContacts(contacts ? [ ...contacts, contact] : [contact])

  if (hasAccess === null) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={{flex: 1, padding: 24, gap: 12, justifyContent: 'center'}}>
        <Text style={{fontSize: 18, fontWeight: '600'}}>Enable “Usage access”</Text>
        <Text>Please enable “Usage access” for this app, then come back. We’ll continue automatically.</Text>
        <Button
          title='I enabled it — recheck'
          onPress={async () => {
            const ok = await ensureUsageAccess();
            if (ok) setHasAccess(true);
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        padding: 10,
        gap: 20,
      }}
    >
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 2}}>
        <Pressable
          onPress={() => setDisplayAddContact(true)}
          style={{
            padding: 10,
            backgroundColor: 'green',
            borderRadius: 5,
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Icon name='add' />
        </Pressable>
        <Pressable
          onPress={onLogout}
          style={{
            padding: 10,
            backgroundColor: 'red',
            borderRadius: 5,
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <Icon name='logout' />
        </Pressable>
      </View>
      {displayAddContact && <AddContactCard toggleShowAddContactCard={toggleShowAddContactCard} addContact={addContact}/>}
      <UsageGoalCard
        usageGoalMinutes={usageGoalMinutes}
        setUsageGoalMinutes={setUsageGoalMinutes}
        onSaveUsageGoal={handleSaveUsageGoal}
      />
      <UsageProgressCard usageGoalMinutes={storedUsageGoalMinutes} usageStats={usageStats} />
    </View>
  );
};
