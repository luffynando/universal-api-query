export const getPostsEmbed = {
  data: [
    {
      id: 1,
      someId: 'ap319-0nh56',
      text: 'Lorem Ipsum Dolor',
      user: {
        firstname: 'John',
        lastname: 'Doe',
        age: 25,
      },
      relationships: {
        tags: [
          {
            name: 'super',
          },
          {
            name: 'awesome',
          },
        ],
      },
    },
    {
      id: 1,
      someId: 'by887-0nv66',
      text: 'Lorem Ipsum Dolor',
      user: {
        firstname: 'Mary',
        lastname: 'Doe',
        age: 25,
      },
      relationships: {
        tags: {
          data: [
            {
              name: 'super',
            },
            {
              name: 'awesome',
            },
          ],
        },
      },
    },
  ],
};
