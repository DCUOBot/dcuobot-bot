export const getWorldIdByServer = (server: string) => {
  switch (server.toLowerCase()) {
    case 'us':
      return 2;
    case 'eu':
      return 4;
    case 'switchus':
      return 10;
    case 'switcheu':
      return 11;
    case 'xbox':
      return 5001;
  }

  throw new Error('Invalid server.');
};

export const getServerByWorldId = (worldId: number) => {
  switch (worldId) {
    case 2:
      return 'USPC/PS';
    case 4:
      return 'EUPC/PS';
    case 10:
      return 'US Switch';
    case 11:
      return 'EU Switch';
    case 5001:
      return 'Xbox';
  }

  throw new Error('Invalid world ID.');
};
