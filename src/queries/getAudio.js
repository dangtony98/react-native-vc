import { gql } from '@apollo/client';

export default gql`
  query GetAudio($offset: Int!, $limit: Int!) {
    getAudio(offset: $offset, limit: $limit) 
    @connection(key: "getAudio") {
      id
      url
      title
      listens
      liked
      likeCount
      isReported
      user {
        id
        username
        imageProf {
          url
        }
        avatar {
          url
        }
      }
    }
  }
`;