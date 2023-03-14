/* eslint-disable import/no-extraneous-dependencies */
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'
import axios from 'axios'
import {
  getNewSubscriberMintInstanceApi,
  getSubscriberMintArweaveApi,
  getSubscriberMintDoneApi,
  getSubscriberMintIscnApi,
  getSubscriberMintNftClassApi,
  getSubscriberMintNftCoverApi,
  getSubscriberMintNftMintApi,
  getUserIsSubscribedMinterApi,
} from '@/constant/api'

@Module({
  name: 'subscription',
  stateFactory: true,
  namespaced: true,
})
export default class SubscriptionStore extends VuexModule {
  isSubscriber = false
  currentMintStatusId = ''
  status = ''
  mintStatusSecret = ''

  @Mutation
  setIsSubscriber(isSubscriber: boolean) {
    this.isSubscriber = isSubscriber
  }

  @Mutation
  setCurrentMintStatusId(currentMintStatusId: string) {
    this.currentMintStatusId = currentMintStatusId
  }

  @Mutation
  setMintStatusSecret(mintStatusSecret: string) {
    this.mintStatusSecret = mintStatusSecret
  }

  @Mutation
  setMintStatus(status: string) {
    this.status = status
  }

  @Action
  resetAllStatus() {
    this.context.commit('setIsSubscriber', false);
    this.context.commit('setCurrentMintStatusId', '');
    this.context.commit('setMintStatusSecret', '');
    this.context.commit('setMintStatus', '');
  }

  @Action
  async fetchCurrentWalletIsSubscriber() {
    const { address: wallet } = this.context.rootState.signer
    try {
      const { data } = await axios.get(getUserIsSubscribedMinterApi(wallet))
      this.context.commit('setIsSubscriber', data.isActive || false)
    } catch (_) {
      // no op
    }
  }

  @Action
  async newMintInstance() {
    const { address: wallet } = this.context.rootState.signer
    try {
      const { data } = await axios.post(getNewSubscriberMintInstanceApi(wallet))
      const { statusId, statusSecret } = data;
      this.context.commit('setCurrentMintStatusId', statusId)
      this.context.commit('setMintStatusSecret', statusSecret)
      this.context.commit('setMintStatus', 'new')
      return data;
    } catch (_) {
      // no op
    }
    return null;
  }

  @Action
  async updateMintInstance({
    status,
    payload,
    options: { headers = {}, ...options } = {},
  }: {
    status: string
    payload: any
    options?: any
  }) {
    const { address: wallet } = this.context.rootState.signer
    const { currentMintStatusId: statusId, mintStatusSecret } = this
    let url;
    switch (status) {
      case 'arweave': {
        url = getSubscriberMintArweaveApi(wallet, statusId)
        break
      }
      case 'iscn': {
        url = getSubscriberMintIscnApi(wallet, statusId)
        break
      }
      case 'nftCover': {
        url = getSubscriberMintNftCoverApi(wallet, statusId)
        break
      }
      case 'nftClass': {
        url = getSubscriberMintNftClassApi(wallet, statusId)
        break
      }
      case 'nftMint': {
        url = getSubscriberMintNftMintApi(wallet, statusId)
        break
      }
      case 'done': {
        url = getSubscriberMintDoneApi(wallet, statusId)
        break
      }
      default:
        throw new Error('INVALID_STATUS');
    }
    const { data } = await axios.post(
      url,
      payload,
      {
        ...options,
        headers: {
          authorization: mintStatusSecret,
          ...headers,
        },
      },
    )
    this.context.commit('setMintStatus', status)
    if (status === 'done') {
      this.context.commit('setCurrentMintStatusId', '');
      this.context.commit('setMintStatusSecret', '');
      this.context.commit('setMintStatus', '');
    }
    return data
  }

  get getAddressIsSubscriber() {
    return this.isSubscriber
  }

  get getCurrentMintStatusId() {
    return this.currentMintStatusId
  }
}
