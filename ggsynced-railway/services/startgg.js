import { GraphQLClient } from 'graphql-request';

const STARTGG_API_URL = 'https://api.start.gg/gql/alpha';

// Fetch tournaments where user is admin
export async function fetchTournaments(accessToken) {
  const client = new GraphQLClient(STARTGG_API_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const query = `
    query ListManagedTournaments {
      currentUser {
        tournaments(query: {perPage: 50}) {
          nodes {
            id
            name
            slug
          }
        }
      }
    }
  `;

  try {
    const data = await client.request(query);
    return data.currentUser?.tournaments?.nodes || [];
  } catch (error) {
    console.error('Start.gg GraphQL error:', error);
    throw new Error('Failed to fetch tournaments');
  }
}

// Fetch participants for a tournament (paginated)
export async function fetchParticipants(accessToken, slug) {
  const client = new GraphQLClient(STARTGG_API_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const allParticipants = [];
  let page = 1;
  let totalPages = 1;

  do {
    const query = `
      query FetchParticipants($slug: String!, $page: Int!) {
        event(slug: $slug) {
          entrants(query: {page: $page, perPage: 100}) {
            nodes {
              participant {
                user {
                  email
                }
              }
            }
            pageInfo {
              totalPages
            }
          }
        }
      }
    `;

    try {
      const data = await client.request(query, { slug, page });
      const entrants = data.event?.entrants?.nodes || [];
      
      entrants.forEach(entrant => {
        if (entrant.participant?.user?.email) {
          allParticipants.push({
            email: entrant.participant.user.email
          });
        }
      });

      totalPages = data.event?.entrants?.pageInfo?.totalPages || 1;
      page++;
    } catch (error) {
      console.error('Start.gg GraphQL error:', error);
      throw new Error('Failed to fetch participants');
    }
  } while (page <= totalPages);

  return allParticipants;
}
