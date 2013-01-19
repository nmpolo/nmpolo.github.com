---
title: Counting returned document types in elasticsearch
layout: default
---

[Elasticsearch] (http://www.elasticsearch.org) allows you to very easily search
across multiple document types. When you perform a search, you get the count of
the total document hits along with some of the matching documents (10 by
default). However, you may need to also show the total document hits for each
document type you're searching across. For example, when you display search
results as follows:

    All Results (1023)
    Users (746)
    Companies (277)

Fortunately, this can be accomplished using [facets] (http://www.elasticsearch.org/guide/reference/api/search/facets/index.html).
One thing to note, however, is that this will not work with filters. You must
use queries to get an accurate type facet count.

So, to retrieve type counts, we can construct a query such as:

    curl -XPOST 127.0.0.1:9200/test/user,company/_search?pretty -d '{
        "facets": {
            "typeHits": {
                "terms": {
                    "field": "_type"
                }
            }
        }
    }'

Or, using Elastica:

    $query = new Elastica\Query();
    $facet = new Elastica\Facet\Terms('typeHits');
    $facet->setField('_type');
    $query->addFacet($facet);

This will give us a response such as:

    {
      "took" : 2,
      "timed_out" : false,
      "_shards" : {
        "total" : 5,
        "successful" : 5,
        "failed" : 0
      },
      "hits" : {
        "total" : 2,
        "max_score" : 1.0,
        "hits" : [ {
          "_index" : "test",
          "_type" : "user",
          "_id" : "1",
          "_score" : 1.0, "_source" : {"name":"Nick"}
        }, {
          "_index" : "test",
          "_type" : "company",
          "_id" : "1",
          "_score" : 1.0, "_source" : {"name":"Acme"}
        } ]
      },
      "facets" : {
        "typeHits" : {
          "_type" : "terms",
          "missing" : 0,
          "total" : 2,
          "other" : 0,
          "terms" : [ {
            "term" : "user",
            "count" : 1
          }, {
            "term" : "company",
            "count" : 1
          } ]
        }
      }
    }

The resulting json tells us our query matched 1 user type document and 1
company type document.
