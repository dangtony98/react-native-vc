import { 
    ApolloClient, 
    InMemoryCache,
    ApolloLink,
    createHttpLink
} from '@apollo/client';
import {setContext} from '@apollo/client/link/context';

const PROD = 'https://sheltered-island-41614.herokuapp.com';
const LOCAL = 'http://localhost:4000/graphql';

const httpLink = createHttpLink({
    uri: LOCAL,
  });

const authLink = setContext(async headers => {
    // get userToken from EncryptedStorage
    
    const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGQ3ZmFlY2VkOTgzMzdiYTMzNjFjOWUiLCJpYXQiOjE2Mzk0ODExNDV9.5M-Oxz4gFfnBCcq1eHwTI4cMaNSxYjtLZGsIdyu6WhQ';

    // add Authorization header
    console.log(headers);
    // console.log(userToken);
    return {
      headers: {
        Authorization: userToken ? `Bearer ${userToken}` : ''
      },
    };
  });

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  });

export { client };