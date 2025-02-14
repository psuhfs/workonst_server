DBs:
categories Collection: 
{ 
 "<location>": { // location could be Stacks, Biscotti, Outpost, Provisions
        "areas": [{
            "name": "<area>",
            "info": {
                "category": {"item_id": "<item_id>", "name": "<name>", "unit_sz": "<unit_sz>"}
            }
        }]
    }
}

orders Collection:

[
    {
        "location": "<location>",
        "area": "<area>",
        "category": "<category>",
        "item_id": "<item_id>",
        "name": "<name>", 
        "unit_sz": "<unit_sz>",
        "quantity": <quentity> // integer
        "timestamp": <time sinze epoch>
    }
]


