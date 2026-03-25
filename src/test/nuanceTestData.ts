/**
 * Mock Reddit JSON data for nuance test scenarios
 * Structured to match actual Reddit API response format
 */

export const nuanceTestThreads = {
  "passive-aggressive-dismissal": [
    {
      kind: "Listing",
      data: {
        title: "Feeling hurt by my partner's comments about my weight",
        selftext: "My partner keeps making comments about what I eat and suggesting I should exercise more. It makes me feel terrible about myself.",
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              parent_id: "t3_post1",
              author: "user1",
              body: "Well, maybe they're just trying to help. If you say so.",
              created_utc: 1710000000,
              replies: ""
            }
          },
          {
            kind: "t1",
            data: {
              id: "c2",
              parent_id: "t3_post1",
              author: "user2",
              body: "I'm sorry but have you considered they might have a point? Maybe you're being too sensitive.",
              created_utc: 1710000020,
              replies: ""
            }
          },
          {
            kind: "t1",
            data: {
              id: "c3",
              parent_id: "t3_post1",
              author: "user3",
              body: "Whatever makes you happy. Do what you want.",
              created_utc: 1710000040,
              replies: ""
            }
          }
        ]
      }
    }
  ],
  "gaslighting-with-care-concern": [
    {
      kind: "Listing",
      data: {
        title: "My ex keeps texting me after I asked for space",
        selftext: "I told my ex I need space but they keep messaging saying they're worried about me and that I'm not thinking clearly.",
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              parent_id: "t3_post2",
              author: "user1",
              body: "Maybe you're overreacting. They sound like they genuinely care.",
              created_utc: 1710000000,
              replies: ""
            }
          },
          {
            kind: "t1",
            data: {
              id: "c2",
              parent_id: "t3_post2",
              author: "user2",
              body: "You're remembering it wrong. I'm sure they didn't mean it that way.",
              created_utc: 1710000020,
              replies: ""
            }
          }
        ]
      }
    }
  ],
  "coercive-control-subtle": [
    {
      kind: "Listing",
      data: {
        title: "Partner gets upset when I spend time with friends",
        selftext: "Every time I make plans with my friends, my partner gets quiet and distant. They say they're fine but then bring it up later in arguments.",
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              parent_id: "t3_post3",
              author: "user1",
              body: "Don't tell anyone we talked about this, it's between us. You have to respond to me about this.",
              created_utc: 1710000000,
              replies: ""
            }
          },
          {
            kind: "t1",
            data: {
              id: "c2",
              parent_id: "t3_post3",
              author: "user2",
              body: "You're mine and you can't ignore me. Answer me.",
              created_utc: 1710000020,
              replies: ""
            }
          }
        ]
      }
    }
  ],
  "blame-shifting-in-conflict": [
    {
      kind: "Listing",
      data: {
        title: "Argument with roommate about cleanliness",
        selftext: "My roommate never does dishes and when I brought it up, they got angry at me.",
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              parent_id: "t3_post4",
              author: "user1",
              body: "This is your fault. You made me do this by nagging constantly.",
              created_utc: 1710000000,
              replies: ""
            }
          },
          {
            kind: "t1",
            data: {
              id: "c2",
              parent_id: "t3_post4",
              author: "user2",
              body: "Look what you made me do. You started it.",
              created_utc: 1710000020,
              replies: ""
            }
          }
        ]
      }
    }
  ],
  "trauma-disclosure-context": [
    {
      kind: "Listing",
      data: {
        title: "Finally ready to talk about what happened to me",
        selftext: "When I was 12, my uncle did things that I'm only now understanding were not okay. I'm struggling with this.",
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              parent_id: "t3_post5",
              author: "user1",
              body: "Why did you wait so long to say something? That doesn't make sense.",
              created_utc: 1710000000,
              replies: ""
            }
          },
          {
            kind: "t1",
            data: {
              id: "c2",
              parent_id: "t3_post5",
              author: "user2",
              body: "Are you sure that's what happened? Kids misremember things.",
              created_utc: 1710000020,
              replies: ""
            }
          }
        ]
      }
    }
  ],
  "mixed-support-criticism": [
    {
      kind: "Listing",
      data: {
        title: "Struggling with depression",
        selftext: "I've been having a really hard time getting out of bed lately. Everything feels overwhelming.",
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              parent_id: "t3_post6",
              author: "user1",
              body: "I'm so sorry you're going through this. Have you tried just exercising more? That always works for me.",
              created_utc: 1710000000,
              replies: ""
            }
          },
          {
            kind: "t1",
            data: {
              id: "c2",
              parent_id: "t3_post6",
              author: "user2",
              body: "That must be so hard. But honestly, you need to just push through it. We all have bad days.",
              created_utc: 1710000020,
              replies: ""
            }
          }
        ]
      }
    }
  ],
  "backhanded-compliments": [
    {
      kind: "Listing",
      data: {
        title: "Proud of finishing my degree at 35",
        selftext: "It took me longer than most people but I finally finished my bachelor's degree!",
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              parent_id: "t3_post7",
              author: "user1",
              body: "Wow, good for you! Must be nice to have all that time. Bless your heart.",
              created_utc: 1710000000,
              replies: ""
            }
          },
          {
            kind: "t1",
            data: {
              id: "c2",
              parent_id: "t3_post7",
              author: "user2",
              body: "No offense but most people do that in their 20s. Better late than never I guess.",
              created_utc: 1710000020,
              replies: ""
            }
          }
        ]
      }
    }
  ],
  "emotional-intensity-anxious": [
    {
      kind: "Listing",
      data: {
        title: "Worried about my child's safety at school",
        selftext: "There have been several incidents at my child's school and I'm terrified something will happen.",
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              parent_id: "t3_post8",
              author: "user1",
              body: "I'm so scared about this too. I'm panicking every day and can't focus. What if something happens? I'm so worried.",
              created_utc: 1710000000,
              replies: ""
            }
          }
        ]
      }
    }
  ],
  "op-context-carryover": [
    {
      kind: "Listing",
      data: {
        title: "My dad tracked my location without telling me",
        selftext: "I'm 24 and found out my dad has been using Find My Friends to track my location for months without asking.",
        children: [
          {
            kind: "t1",
            data: {
              id: "c1",
              parent_id: "t3_post9",
              author: "user1",
              body: "He's just worried about you. Parents do that.",
              created_utc: 1710000000,
              replies: ""
            }
          },
          {
            kind: "t1",
            data: {
              id: "c2",
              parent_id: "t3_post9",
              author: "user2",
              body: "You're overreacting. It's normal for family.",
              created_utc: 1710000020,
              replies: ""
            }
          }
        ]
      }
    }
  ]
};
