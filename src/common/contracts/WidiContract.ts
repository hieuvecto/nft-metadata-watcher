import { networks } from '../../contracts/Widi.json';

export const getOpenBoxTypeEventTopics = (networkId: string) => {
  const { events } = networks[networkId];
  return Object.keys(events).filter(
    (key) => events[key].name === 'OpenBoxType',
  );
};

export const getWidiContractAddress = (networkId: string): string =>
  networks[networkId].address.toLowerCase();
