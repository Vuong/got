import { useState, useContext, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import { DisplayContext } from '../context/DisplayContext'
import { Focus, FocusDetail, Topic, Profile, Card, AssetType, AssetSource, TransformType } from 'databag-client-sdk'
import { ContextType } from '../context/ContextType'
import Resizer from 'react-image-file-resizer'

let IMAGE_SCALE_SIZE = 128 * 1024
let GIF_TYPE = 'image/gif'
let WEBP_TYPE = 'image/webp'
let LOAD_DEBOUNCE = 1000

function getImageThumb(file: File) {
  return new Promise<string>((resolve, reject) => {
    if ((file.type === GIF_TYPE || file.type === WEBP_TYPE) && file.size < IMAGE_SCALE_SIZE) {
      let reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = function () {
        resolve(reader.result as string)
      }
      reader.onerror = function () {
        reject()
      }
    } else {
      Resizer.imageFileResizer(
        file,
        192,
        192,
        'JPEG',
        50,
        0,
        (uri) => {
          resolve(uri as string)
        },
        'base64',
        128,
        128
      )
    }
  })
}

function getVideoThumb(file: File, position?: number) {
  return new Promise<string>((resolve, reject) => {
    let url = URL.createObjectURL(file)
    let video = document.createElement('video')
    let timeupdate = function () {
      video.removeEventListener('timeupdate', timeupdate)
      video.pause()
      setTimeout(() => {
        let canvas = document.createElement('canvas')
        if (!canvas) {
          reject()
        } else {
          if (video.videoWidth > video.videoHeight) {
            canvas.width = 192
            canvas.height = Math.floor((192 * video.videoHeight) / video.videoWidth)
          } else {
            canvas.height = 192
            canvas.width = Math.floor((192 * video.videoWidth) / video.videoHeight)
          }
          let context = canvas.getContext('2d')
          if (!context) {
            reject()
          } else {
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
            let image = canvas.toDataURL('image/jpeg', 0.75)
            resolve(image)
          }
        }
        canvas.remove()
        video.remove()
        URL.revokeObjectURL(url)
      }, 1000)
    }
    video.addEventListener('timeupdate', timeupdate)
    video.addEventListener('error', () => {
      reject()
      video.remove()
      URL.revokeObjectURL(url)
    })
    video.preload = 'metadata'
    video.src = url
    video.muted = true
    video.playsInline = true
    video.currentTime = position ? position : 0
    video.play()
  })
}

export function useConversation() {
  let app = useContext(AppContext) as ContextType
  let display = useContext(DisplayContext) as ContextType
  let [state, setState] = useState({
    detail: undefined as FocusDetail | null | undefined,
    strings: display.state.strings,
    cardId: null as null | string,
    detailSet: false,
    focus: null as Focus | null,
    layout: null,
    topics: [] as Topic[],
    loaded: false,
    loadingMore: false,
    profile: null as Profile | null,
    cards: new Map<string, Card>(),
    host: false,
    sealed: false,
    access: false,
    subject: '',
    subjectNames: [],
    unknownContacts: 0,
    message: '',
    assets: [] as { type: string; file: File; position?: number; label?: string }[],
    textColor: '#444444',
    textColorSet: false,
    textSize: 16,
    textSizeSet: false,
    progress: 0,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updateState = (value: any) => {
    setState((s) => ({ ...s, ...value }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updateAsset = (index: number, value: any) => {
    setState((s) => {
      s.assets[index] = { ...s.assets[index], ...value }
      return { ...s }
    })
  }

  useEffect(() => {
    let { layout, strings } = display.state
    updateState({ layout, strings })
  }, [display.state])

  useEffect(() => {
    let host = state.cardId == null
    let sealed = state.detail ? state.detail.sealed : false
    let access = state.detail != null
    let subject = state.detail?.data?.subject ? state.detail.data.subject : null
    let cards = Array.from(state.cards.values())
    let card = cards.find((entry) => entry.cardId == state.cardId)
    let profileRemoved = state.detail?.members ? state.detail.members.filter((member) => state.profile?.guid != member.guid) : []
    let unhostedCards = profileRemoved.map((member) => state.cards.get(member.guid))
    let contactCards = card ? [card, ...unhostedCards] : unhostedCards
    let subjectCards = contactCards.filter((member) => Boolean(member))
    let subjectNames = subjectCards.map((member) => (member?.name ? member.name : member?.handle))
    let unknownContacts = contactCards.length - subjectCards.length
    updateState({ host, sealed, access, subject, subjectNames, unknownContacts, detailSet: state.detail !== undefined })
  }, [state.detail, state.cards, state.profile, state.cardId])

  useEffect(() => {
    let focus = app.state.focus
    let { contact, identity } = app.state.session || {}
    if (focus && contact && identity) {
      let setTopics = (topics: Topic[]) => {
        if (topics) {
          let filtered = topics.filter((topic) => !topic.blocked)
          let sorted = filtered.sort((a, b) => {
            if (a.created < b.created) {
              return -1
            } else if (a.created > b.created) {
              return 1
            } else {
              return 0
            }
          })
          updateState({ topics: sorted, loaded: true })
        }
      }
      let setCards = (cards: Card[]) => {
        let contacts = new Map<string, Card>()
        cards.forEach((card) => {
          contacts.set(card.guid, card)
        })
        updateState({ cards: contacts })
      }
      let setProfile = (profile: Profile) => {
        updateState({ profile })
      }
      let setDetail = (focused: { cardId: string | null; channelId: string; detail: FocusDetail | null }) => {
        let detail = focused ? focused.detail : null
        let cardId = focused.cardId
        updateState({ detail, cardId })
      }
      updateState({ assets: [], message: '', topics: [], loaded: false })
      focus.addTopicListener(setTopics)
      focus.addDetailListener(setDetail)
      contact.addCardListener(setCards)
      identity.addProfileListener(setProfile)
      return () => {
        focus.removeTopicListener(setTopics)
        focus.removeDetailListener(setDetail)
        contact.removeCardListener(setCards)
        identity.removeProfileListener(setProfile)
      }
    }
  }, [app.state.focus])

  let actions = {
    close: () => {
      app.actions.clearFocus()
    },
    setMessage: (message: string) => {
      updateState({ message })
    },
    setTextSize: (textSize: number) => {
      let textSizeSet = true
      updateState({ textSize, textSizeSet })
    },
    setTextColor: (textColor: string) => {
      let textColorSet = true
      updateState({ textColor, textColorSet })
    },
    setThumbPosition: (index: number, position: number) => {
      updateAsset(index, { position })
    },
    setLabel: (index: number, label: string) => {
      updateAsset(index, { label })
    },
    removeAsset: (index: number) => {
      state.assets.splice(index, 1)
      updateState({ assets: [...state.assets] })
    },
    more: async () => {
      let focus = app.state.focus
      if (focus) {
        if (!state.loadingMore) {
          updateState({ loadingMore: true })
          await focus.viewMoreTopics()
          setTimeout(() => {
            updateState({ loadingMore: false })
          }, LOAD_DEBOUNCE)
        }
      }
    },
    send: async () => {
      let focus = app.state.focus
      let sealed = state.detail?.sealed ? true : false
      if (focus) {
        let sources = [] as AssetSource[]
        let uploadAssets = state.assets.map((asset) => {
          if (asset.type === 'image') {
            if (sealed) {
              sources.push({
                type: AssetType.Image,
                source: asset.file,
                transforms: [
                  { type: TransformType.Thumb, appId: `it${sources.length}`, thumb: () => getImageThumb(asset.file) },
                  { type: TransformType.Copy, appId: `ic${sources.length}` },
                ],
              })
              return { encrypted: { type: 'image', thumb: `it${sources.length - 1}`, parts: `ic${sources.length - 1}` } }
            } else {
              sources.push({
                type: AssetType.Image,
                source: asset.file,
                transforms: [
                  { type: TransformType.Thumb, appId: `it${sources.length}` },
                  { type: TransformType.Copy, appId: `ic${sources.length}` },
                ],
              })
              return { image: { thumb: `it${sources.length - 1}`, full: `ic${sources.length - 1}` } }
            }
          } else if (asset.type === 'video') {
            if (sealed) {
              sources.push({
                type: AssetType.Video,
                source: asset.file,
                transforms: [
                  { type: TransformType.Thumb, appId: `vt${sources.length}`, thumb: () => getVideoThumb(asset.file, asset.position) },
                  { type: TransformType.Copy, appId: `vc${sources.length}` },
                ],
              })
              return { encrypted: { type: 'video', thumb: `vt${sources.length - 1}`, parts: `vc${sources.length - 1}` } }
            } else {
              sources.push({
                type: AssetType.Video,
                source: asset.file,
                transforms: [
                  { type: TransformType.Thumb, appId: `vt${sources.length}`, position: asset.position },
                  { type: TransformType.HighQuality, appId: `vh${sources.length}` },
                  { type: TransformType.LowQuality, appId: `vl${sources.length}` },
                ],
              })
              return { video: { thumb: `vt${sources.length - 1}`, hd: `vh${sources.length - 1}`, lq: `vl${sources.length - 1}` } }
            }
          } else if (asset.type === 'audio') {
            if (sealed) {
              sources.push({ type: AssetType.Audio, source: asset.file, transforms: [{ type: TransformType.Copy, appId: `ac${sources.length}` }] })
              return { encrypted: { type: 'audio', label: asset.label, parts: `ac${sources.length - 1}` } }
            } else {
              sources.push({ type: AssetType.Audio, source: asset.file, transforms: [{ type: TransformType.Copy, appId: `ac${sources.length}` }] })
              return { audio: { label: asset.label, full: `ac${sources.length - 1}` } }
            }
          } else {
            let extension = asset.file.name.split('.').pop()
            let label = asset.file.name.split('.').shift()
            if (sealed) {
              sources.push({ type: AssetType.Binary, source: asset.file, transforms: [{ type: TransformType.Copy, appId: `bc${sources.length}` }] })
              return { encrypted: { type: 'binary', label, extension, parts: `bc${sources.length - 1}` } }
            } else {
              sources.push({ type: AssetType.Binary, source: asset.file, transforms: [{ type: TransformType.Copy, appId: `bc${sources.length}` }] })
              return { binary: { label, extension, data: `bc${sources.length - 1}` } }
            }
          }
        })
        let subject = (uploaded: { assetId: string; appId: string }[]) => {
          let assets = uploadAssets.map((asset) => {
            if (asset.encrypted) {
              let type = asset.encrypted.type
              let label = asset.encrypted.label
              let extension = asset.encrypted.extension
              let thumb = uploaded.find((upload) => upload.appId === asset.encrypted.thumb)?.assetId
              let parts = uploaded.find((upload) => upload.appId === asset.encrypted.parts)?.assetId
              if (type === 'image' || type === 'video') {
                return { encrypted: { type, thumb, parts } }
              } else if (type === 'audio') {
                return { encrypted: { type, label, parts } }
              } else {
                return { encrypted: { type, label, extension, parts } }
              }
            } else if (asset.image) {
              let thumb = uploaded.find((upload) => upload.appId === asset.image.thumb)?.assetId
              let full = uploaded.find((upload) => upload.appId === asset.image.full)?.assetId
              return { image: { thumb, full } }
            } else if (asset.video) {
              let thumb = uploaded.find((upload) => upload.appId === asset.video.thumb)?.assetId
              let hd = uploaded.find((upload) => upload.appId === asset.video.hd)?.assetId
              let lq = uploaded.find((upload) => upload.appId === asset.video.lq)?.assetId
              return { video: { thumb, hd, lq } }
            } else if (asset.audio) {
              let label = asset.audio.label
              let full = uploaded.find((upload) => upload.appId === asset.audio.full)?.assetId
              return { audio: { label, full } }
            } else {
              let data = uploaded.find((upload) => upload.appId === asset.binary.data)?.assetId
              let { label, extension } = asset.binary
              return { binary: { label, extension, data } }
            }
          })
          return { text: state.message, textColor: state.textColorSet ? state.textColor : null, textSize: state.textSizeSet ? state.textSize : null, assets: assets.length > 0 ? assets : null }
        }
        let upload = (progress: number) => {
          updateState({ progress })
        }
        await focus.addTopic(sealed, sealed ? 'sealedtopic' : 'superbasictopic', subject, sources, upload)
        updateState({ message: '', assets: [], progress: 0 })
      }
    },
    addImage: (file: File) => {
      let type = 'image'
      updateState({ assets: [...state.assets, { type, file }] })
    },
    addVideo: (file: File) => {
      let type = 'video'
      updateState({ assets: [...state.assets, { type, file }] })
    },
    addAudio: (file: File) => {
      let type = 'audio'
      updateState({ assets: [...state.assets, { type, file }] })
    },
    addBinary: (file: File) => {
      let type = 'binary'
      updateState({ assets: [...state.assets, { type, file }] })
    },
  }

  return { state, actions }
}
