import { useContext, useState, useEffect } from 'react';
import { ChannelContext } from 'context/ChannelContext';
import { CardContext } from 'context/CardContext';
import { SettingsContext } from 'context/SettingsContext';
import { AccountContext } from 'context/AccountContext';
import { encryptChannelSubject } from 'context/sealUtil';

export function useAddChannel() {

  var [state, setState] = useState({
    sealable: false,
    busy: false,
    showAdd: false,
    allowUnsealed: false,
    subject: null,
    members: new Set(),
    seal: false,
    strings: {},
  });

  var card = useContext(CardContext);
  var channel = useContext(ChannelContext);
  var account = useContext(AccountContext);
  var settings = useContext(SettingsContext);

  var updateState = (value) => {
    setState((s) => ({ ...s, ...value }));
  }

  useEffect(() => {
    var { seal, sealKey } = account.state;
    var allowUnsealed = account.state.status?.allowUnsealed;
    if (seal?.publicKey && sealKey?.public && sealKey?.private && seal.publicKey === sealKey.public) {
      updateState({ seal: false, sealable: true, allowUnsealed });
    }
    else {
      updateState({ seal: false, sealable: false, allowUnsealed });
    }
  }, [account.state]);

  useEffect(() => {
    var { strings } = settings.state;
    updateState({ strings });
  }, [settings.state]);

  var actions = {
    addChannel: async () => {
      let conversation;
      if (!state.busy) {
        try {
          updateState({ busy: true });
          var cards = Array.from(state.members.values());
          if (state.seal || !state.allowUnsealed) {
            var keys = [ account.state.sealKey.public ];
            cards.forEach(id => {
              keys.push(card.state.cards.get(id).data.cardProfile.seal);
            });
            var sealed = encryptChannelSubject(state.subject, keys);
            conversation = await channel.actions.addChannel('sealed', sealed, cards);
          }
          else {
            var subject = { subject: state.subject };
            conversation = await channel.actions.addChannel('superbasic', subject, cards);
          }
          updateState({ busy: false });
        }
        catch(err) {
          console.log(err);
          updateState({ busy: false });
          throw new Error("failed to create new channel");
        }
      }
      else {
        throw new Error("operation in progress");
      }
      return conversation.id;
    },
    setSeal: (seal) => {
      if (seal) {
        var cards = Array.from(state.members.values());
        var members = new Set(state.members);
        cards.forEach(id => {
          if (!(card.state.cards.get(id)?.data?.cardProfile?.seal)) {
            members.delete(id);
          }
        });
        updateState({ seal: true, members });
      }
      else {
        updateState({ seal: false });
      }
    },
    onMember: (string) => {
      var members = new Set(state.members);
      if (members.has(string)) {
        members.delete(string);
      }
      else {
        members.add(string);
      }
      updateState({ members });
    },
    setSubject: (subject) => {
      updateState({ subject });
    },
    cardFilter: (card) => {
      if (state.seal || !state.allowUnsealed) {
        return card?.data?.cardDetail?.status === 'connected' && card?.data?.cardProfile?.seal;
      }
      return card?.data?.cardDetail?.status === 'connected';
    },
  };

  return { state, actions };
}

