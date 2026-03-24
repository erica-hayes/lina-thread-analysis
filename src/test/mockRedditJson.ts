export const mockRedditJson = [
  {
    kind: "Listing",
    data: {
      title: "My partner and I keep arguing about politics",
      selftext: "Looking for advice on de-escalating conflicts at home.",
      children: [
        {
          kind: "t1",
          data: {
            id: "c1",
            parent_id: "t3_post1",
            author: "userA",
            body: "This update is garbage and the mods did nothing.",
            created_utc: 1710000000,
            replies: {
              kind: "Listing",
              data: {
                children: [
                  {
                    kind: "t1",
                    data: {
                      id: "c2",
                      parent_id: "t1_c1",
                      author: "userB",
                      body: "Relax, no need for insults.",
                      created_utc: 1710000020,
                      replies: ""
                    }
                  },
                  {
                    kind: "t1",
                    data: {
                      id: "c3",
                      parent_id: "t1_c1",
                      author: "userA",
                      body: "NO, this is TERRIBLE!!! FIX THIS NOW!!!",
                      created_utc: 1710000040,
                      replies: {
                        kind: "Listing",
                        data: {
                          children: [
                            {
                              kind: "t1",
                              data: {
                                id: "c4",
                                parent_id: "t1_c3",
                                author: "userC",
                                body: "You are acting like a clown.",
                                created_utc: 1710000060,
                                replies: ""
                              }
                            },
                            {
                              kind: "t1",
                              data: {
                                id: "c5",
                                parent_id: "t1_c4",
                                author: "userA",
                                body: "Shut up idiot, you're wrong and useless!!!",
                                created_utc: 1710000080,
                                replies: ""
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        {
          kind: "t1",
          data: {
            id: "c6",
            parent_id: "t3_post1",
            author: "userD",
            body: "Thanks for clarifying, I think we can calm down and discuss.",
            created_utc: 1710000100,
            replies: {
              kind: "Listing",
              data: {
                children: [
                  {
                    kind: "t1",
                    data: {
                      id: "c7",
                      parent_id: "t1_c6",
                      author: "userE",
                      body: "Good point. Appreciate the calm response.",
                      created_utc: 1710000120,
                      replies: ""
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  }
];