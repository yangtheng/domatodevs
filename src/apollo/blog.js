import { gql } from 'react-apollo'

export const queryBlog = gql`
  query queryBlog($id: ID!) {
    findBlog(id: $id) {
      id
      title
      published
      textContent
      views
      createdAt
      likes {
        id
      }
      user {
        id
        name
      }
      pages {
        type
        modelId
        loadSequence
        BlogHeading {
          id
          title
        }
        Post {
          id
          textContent
          location {
            name
          }
          contentOnly
          ParentPostId
          title
          description
          eventType
          start
          startDay
          endDay
          childPosts {
            id
          }
          media {
            type
            url
            loadSequence
            caption
          }
        }
      }
    }
  }`
