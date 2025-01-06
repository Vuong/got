import { useState, useRef, useEffect, useContext } from 'react';
import { ChannelContext } from 'context/ChannelContext';
import { CardContext } from 'context/CardContext';
import { AccountContext } from 'context/AccountContext';
import { AppContext } from 'context/AppContext';
import { ProfileContext } from 'context/ProfileContext';
import { getChannelSeals, isUnsealed, getContentKey, encryptChannelSubject, decryptChannelSubject, decryptTopicSubject } from 'context/sealUtil';
import { getCardByGuid } from 'context/cardUtil';
import { getChannelSubjectLogo } from 'context/channelUtil';
import { getLanguageStrings } from 'constants/Strings';

export function useChannels() {
  var [state, setState] = useState({
    strings: getLanguageStrings(),
    filter: null,
    channels: [],
    adding: false,
    contacts: [],
    addMembers: [],
    addSubject: null,
    sealed: false,
    sealable: false,
    allowUnsealed: false,
    busy: false,
  });

  var channel = useContext(ChannelContext);
  var card = useContext(CardContext);
  var account = useContext(AccountContext);
  var profile = useContext(ProfileContext);
  var app = useContext(AppContext);
  
  var filter = useRef();
  var syncing = useRef(false);
  var resync = useRef(false);

  var updateState = (value) => {
    setState((s) => ({ ...s, ...value }));
  }

  var setChannelItem = async (loginTimestamp, cardId, channelId, item) => {
    var timestamp = item.summary.lastTopic.created;
    var { readRevision, topicRevision, blocked } = item;

    // decrypt subject and message
    let locked = false;
    let unlocked = false;
    if (item.detail.dataType === 'sealed') {
      locked = true;
      var seals = getChannelSeals(item.detail.data);
      if (isUnsealed(seals, account.state.sealKey)) {
        unlocked = true;
        if (!item.unsealedDetail) {
          try {
            var contentKey = await getContentKey(seals, account.state.sealKey);
            var unsealed = decryptChannelSubject(item.detail.data, contentKey);
            if (unsealed) {
              if (cardId) {
                await card.actions.setUnsealedChannelSubject(cardId, channelId, item.detailRevision, unsealed);
              }
              else {
                await channel.actions.setUnsealedChannelSubject(channelId, item.detailRevision, unsealed);
              }
            }
          }
          catch(err) {
            console.log(err);
          }
        }
        if (item.summary.lastTopic.dataType === 'sealedtopic') {
          if (!item.unsealedSummary) {
            try {
              var contentKey = await getContentKey(seals, account.state.sealKey);
              var unsealed = decryptTopicSubject(item.summary.lastTopic.data, contentKey);
              if (unsealed) {
                if (cardId) {
                  await card.actions.setUnsealedChannelSummary(cardId, channelId, item.topicRevision, unsealed);
                }
                else {
                  await channel.actions.setUnsealedChannelSummary(channelId, item.topicRevision, unsealed);
                }
              }
            }
            catch(err) {
              console.log(err);
            }
          }
        }
      }
    }

    let message;
    if (item?.detail?.dataType === 'sealed') {
      if (typeof item?.unsealedSummary?.message?.text === 'string') {
        message = item.unsealedSummary.message.text;
      }
    }
    if (item.detail.dataType === 'superbasic') {
      if (item.summary.lastTopic.dataType === 'superbasictopic') {
        try {
          var data = JSON.parse(item.summary.lastTopic.data);
          if (typeof data.text === 'string') {
            message = data.text;
          }
        }
        catch(err) {
          console.log(err);
        }
      }
    }

    var profileGuid = profile.state?.identity?.guid;
    var { logo, subject } = getChannelSubjectLogo(cardId, profileGuid, item, card.state.cards, card.actions.getCardImageUrl, state.strings);

    var updated = (loginTimestamp < timestamp) && (readRevision < topicRevision);

    return { cardId, channelId, subject, message, logo, timestamp, updated, locked, unlocked, blocked };
  }

  useEffect(() => {
    var allowUnsealed = account.state.status?.allowUnsealed;
    var { status, sealKey } = account.state;
    if (status?.seal?.publicKey && sealKey?.public && sealKey?.private && sealKey?.public === status.seal.publicKey) {
      updateState({ sealable: true, allowUnsealed });
    }
    else {
      updateState({ sealed: false, sealable: false, allowUnsealed });
    }
  }, [account.state]);

  useEffect(() => {
    var contacts = [];
    card.state.cards.forEach(entry => {
      contacts.push(entry.card);
    });
    var filtered = contacts.filter(contact => {
      if (contact == null) {
        return false;
      }
      if (contact.detail.status !== 'connected') {
        return false;
      }
      if ((!state.allowUnsealed || state.sealed) && !contact.profile.seal) {
        return false;
      }
      return true;
    });
    var sorted = filtered.sort((a, b) => {
      var aName = a?.profile?.name;
      var bName = b?.profile?.name;
      if (aName === bName) {
        return 0;
      }
      if (!aName || (aName < bName)) {
        return -1;
      }
      return 1;
    });
    var addMembers = state.addMembers.filter(item => sorted.some(contact => contact.cardId === item));
    updateState({ contacts: sorted, addMembers });
  }, [card.state, state.sealed, state.allowUnsealed]);

  useEffect(() => {
    syncChannels();
    filter.current = state.filter;
  }, [app.state, card.state, channel.state, state.filter, state.sealable]);

  var syncChannels = async () => {
    if (syncing.current) {
      resync.current = true;
    }
    else {
      syncing.current = true;

      var { loginTimestamp } = app.state;
      var items = [];
      channel.state.channels.forEach((item, channelId) => {
        items.push({ loginTimestamp, channelId, channelItem: item });
      });
      card.state.cards.forEach((cardItem, cardId) => {
        cardItem.channels.forEach((channelItem, channelId) => {
          items.push({ loginTimestamp, cardId, channelId, channelItem });
        });
      });
      var channels = [];
      for (let i = 0; i < items.length; i++) {
        var { loginTimestamp, cardId, channelId, channelItem } = items[i];
        channels.push(await setChannelItem(loginTimestamp, cardId, channelId, channelItem));
      }
      var filtered = channels.filter(item => {
        if (item.blocked) {
          return false;
        }
        if (!filter.current) {
          return true;
        }
        var filterCase = filter.current.toUpperCase();
        var subjectCase = item.subject.toUpperCase();
        return subjectCase.includes(filterCase);
      });
      var sorted = filtered.sort((a, b) => {
        var aCreated = a?.timestamp;
        var bCreated = b?.timestamp;
        if (aCreated === bCreated) {
          return 0;
        }
        if (!aCreated || aCreated < bCreated) {
          return 1;
        }
        return -1;
      });
      updateState({ channels: sorted });

      syncing.current = false;
      if(resync.current) {
        resync.current = false;
        await syncChannels();
      }
    }
  };

  var actions = {
    setSealed: (sealed) => {
      updateState({ sealed });
    },
    setFilter: (filter) => {
      updateState({ filter });
    },
    showAdding: () => {
      updateState({ adding: true, addSubject: null, addMembers: [] });
    },
    hideAdding: () => {
      updateState({ adding: false });
    },
    setAddSubject: (addSubject) => {
      updateState({ addSubject });
    },
    setAddMember: (cardId) => {
      updateState({ addMembers: [ ...state.addMembers, cardId ] });
    },
    clearAddMember: (cardId) => {
      updateState({ addMembers: state.addMembers.filter(item => item !== cardId) });
    },
    addChannel: async () => {
      let conversation;
      if (!state.busy) {
        try {
          updateState({ busy: true });
          if (state.sealed || !state.allowUnsealed) {
            var keys = [ account.state.sealKey.public ];
            state.addMembers.forEach(id => {
              var contact = card.state.cards.get(id);
              keys.push(contact.card.profile.seal);
            });
            var sealed = encryptChannelSubject(state.addSubject, keys);
            conversation = await channel.actions.addChannel('sealed', sealed, state.addMembers);
          }
          else {
            var subject = { subject: state.addSubject };
            conversation = await channel.actions.addChannel('superbasic', subject, state.addMembers);
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
  };

  return { state, actions };
}

