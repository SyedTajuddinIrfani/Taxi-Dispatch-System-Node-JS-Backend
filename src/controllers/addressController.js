const client = require("../../elasticsearchClient");

// Get All
const getAllAddresses = async (req, res) => {
  try {
    const response = await client.search({
      index: "addresses",
      size: 10000,
      query: { match_all: {} },
    });

    const hits = response.hits.hits.map((hit) => hit._source);
    res.status(200).json(hits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

// Search with Complete Response (All Field) MULTIPLE DATA
// const searchAddresses = async (req, res) => {
//   try {
//     const search = req.query.search;

//     const response = await client.search({
//       index: "addresses",
//       size: 100,
//       query: {
//         bool: {
//           should: [
//             {
//               term: {
//                 postcode: {
//                   value: search.toUpperCase(),
//                   boost: 5
//                 }
//               }
//             },
//             {
//               match_phrase: {
//                 name: {
//                   query: search,
//                   boost: 3
//                 }
//               }
//             },
//             {
//               multi_match: {
//                 query: search,
//                 fields: ["name", "postcode", "area", "district", "sector", "unit", "type"]
//               }
//             }
//           ]
//         }
//       }
//     });

//     const hits = response.hits.hits.map(hit => hit._source);
//     res.status(200).json(hits);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Search failed" });
//   }
// };


// SEARCH LOCATION WITH COMPLETE POSTCODE EXACT
// const searchAddresses = async (req, res) => {
//   try {
//     const rawSearch = req.query.search.trim();
//     const search = rawSearch.toUpperCase();

//     // 🧠 Check if input looks like a UK postcode
//     const isPostcode = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i.test(search);

//     const response = await client.search({
//       index: "addresses",
//       size: 100,
//       query: {
//         bool: {
//           should: [
//             // 1️⃣ Exact postcode match (if it's a postcode)
//             ...(isPostcode
//               ? [
//                   {
//                     match_phrase: {
//                       postcode: {
//                         query: search,
//                         boost: 10,
//                       },
//                     },
//                   },
//                   {
//                     match_phrase: {
//                       unit: {
//                         query: search,
//                         boost: 8,
//                       },
//                     },
//                   },
//                   {
//                     wildcard: {
//                       postcode: {
//                         value: search.replace(/\s/g, "") + "*", // covers TN376EB style
//                         boost: 5,
//                       },
//                     },
//                   },
//                 ]
//               : []),

//             // 2️⃣ Street or name match (for non-postcode searches)
//             {
//               match_phrase: {
//                 name: {
//                   query: rawSearch,
//                   boost: 3,
//                 },
//               },
//             },
//           ],
//           minimum_should_match: 1,
//         },
//       },
//     });

//     const hits = response.hits.hits.map((h) => h._source);

//     // 🧹 Optional: filter out noise if it was a postcode search
//     const filtered = isPostcode
//       ? hits.filter((item) =>
//           item.postcode?.replace(/\s/g, "").toUpperCase() ===
//           search.replace(/\s/g, "")
//         )
//       : hits;

//     res.status(200).json(filtered);
//   } catch (err) {
//     console.error("Address search failed:", err);
//     res.status(500).json({ message: "Search failed" });
//   }
// };

// SEARCH LOCATION WITH POSTCODE EXACT
const searchAddresses = async (req, res) => {
  try {
    const rawSearch = req.query.search.trim();
    const search = rawSearch.toUpperCase();

    // 🧠 Detect if input is a postcode or prefix of one
    const isPostcodeLike = /^[A-Z]{1,2}\d{0,2}[A-Z]?\s*\d?[A-Z]{0,2}$/i.test(search);

    const response = await client.search({
      index: "addresses",
      size: 100,
      query: {
        bool: {
          should: [
            // 1️⃣ Exact postcode match (for full postcodes)
            {
              match_phrase: {
                postcode: {
                  query: search,
                  boost: 10,
                },
              },
            },
            {
              match_phrase: {
                unit: {
                  query: search,
                  boost: 8,
                },
              },
            },

            // 2️⃣ Partial postcode prefix search (TN / TN3 / TN37 / TN37 6)
            ...(isPostcodeLike
              ? [
                  {
                    wildcard: {
                      postcode: {
                        value: `${search.replace(/\s/g, '')}*`,
                        boost: 6,
                      },
                    },
                  },
                  {
                    wildcard: {
                      unit: {
                        value: `${search.replace(/\s/g, '')}*`,
                        boost: 5,
                      },
                    },
                  },
                ]
              : []),

            // 3️⃣ Street or building name fallback
            {
              match_phrase_prefix: {
                name: {
                  query: rawSearch,
                  boost: 2,
                },
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    });

    const hits = response.hits.hits.map((h) => h._source);

    // 🧹 Clean duplicates
    const unique = hits.filter(
      (v, i, a) =>
        a.findIndex((t) => t.name === v.name && t.postcode === v.postcode) === i
    );

    res.status(200).json(unique);
  } catch (err) {
    console.error("Address search failed:", err);
    res.status(500).json({ message: "Search failed" });
  }
};


// Search With Name and Postcode
// const searchAddresses = async (req, res) => {
//   try {
//     const search = req.query.search;

//     const response = await client.search({
//       index: "addresses",
//       size: 100,
//       query: {
//         bool: {
//           should: [
//             {
//               term: {
//                 postcode: {
//                   value: search.toUpperCase(),
//                   boost: 5,
//                 },
//               },
//             },
//             {
//               match_phrase: {
//                 name: {
//                   query: search,
//                   boost: 3,
//                 },
//               },
//             },
//             {
//               multi_match: {
//                 query: search,
//                 fields: [
//                   "name",
//                   "postcode",
//                   "area",
//                   "district",
//                   "sector",
//                   "unit",
//                   "type",
//                 ],
//               },
//             },
//           ],
//         },
//       },
//     });

//     // 👇 Format results (only name + postcode)
//     const formatted = response.hits.hits.map((hit) => {
//       const src = hit._source;
//       return `${src.name} - ${src.postcode}`;
//     });

//     res.status(200).json({ status: true, count: formatted.length, addresses:formatted });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Search failed" });
//   }
// };

// Get Lat/Lon by Name + Postcode
const getLatLon = async (req, res) => {
  try {
    const search = req.query.search;

    const lastHyphenIndex = search.lastIndexOf("-");
    if (lastHyphenIndex === -1) {
      return res.status(400).json({ message: "Invalid address format" });
    }

    const address = search.substring(0, lastHyphenIndex).trim();
    const postcode = search.substring(lastHyphenIndex + 1).trim();

    const response = await client.search({
      index: "addresses",
      size: 1,
      query: {
        bool: {
          must: [
            { match_phrase: { name: address } },
            { match_phrase: { postcode: postcode } },
          ],
        },
      },
    });

    if (response.hits.hits.length > 0) {
      const { lat, lon } = response.hits.hits[0]._source;
      res.status(200).json({ status: true, lat, lon });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching Lat/Lon" });
  }
};

module.exports = { getAllAddresses, searchAddresses, getLatLon };
