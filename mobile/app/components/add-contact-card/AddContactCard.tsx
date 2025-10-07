import { ADD_CONTACT_MUTATION } from '@/app/api/mutations/addContact';
import { User } from '@/app/api/types';
import { useGql } from '@/app/hooks/useGql';
import {Icon} from '@rneui/base';
import {useState} from 'react';
import {Pressable, TextInput, View} from 'react-native';

export type AddContactCard = {
  toggleShowAddContactCard: () => void;
  addContact: (contact: User) => void;
};

export const AddContactCard = ({toggleShowAddContactCard, addContact}: AddContactCard) => {
    const {call} = useGql();
  const [mobileNumber, setMobileNumber] = useState<string>();

  const onAddContact = async () => {
    call<{contact: User}>(ADD_CONTACT_MUTATION)
    .then(response => addContact(response.contact))
    .catch(e => console.error(e))
  }

  return (
    <View style={{display: 'flex', width: '100%'}}>
      <TextInput
        style={{width: 'auto', height: 40, borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 8}}
        onChangeText={setMobileNumber}
      ></TextInput>
      <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>

      <Pressable
        onPress={onAddContact}
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
        onPress={toggleShowAddContactCard}
        style={{
            padding: 10,
            backgroundColor: 'red',
            borderRadius: 5,
            minWidth: 44,
            minHeight: 44,
        }}
        >
        <Icon name='minus' />
      </Pressable>
          </View>
    </View>
  );
};
