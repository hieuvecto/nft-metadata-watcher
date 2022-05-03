import { networks } from '../../contracts/Widi.json';

export const getOpenBoxTypeEventTopics = (networkId: string) => {
  const { events } = networks[networkId];
  return Object.keys(events).filter(
    (key) => events[key].name === 'OpenBoxType',
  );
};

export const getWidiCharContractAddress = (networkId: string): string =>
  '0x5fdcf857957e9db2b58be6c5f499a2bc8d64f24c';

export const getWidiLandContractAddress = (networkId: string): string =>
  '0x94595B3B94B2df23fEb9557A2AC295267877e646';