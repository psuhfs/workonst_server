DBs:
categories Collection:

```json
{
  "<location>": {
    // location could be Stacks, Biscotti, Outpost, Provisions
    "areas": [
      {
        "name": "<area>",
        "info": {
          "category": {
            "item_id": "<item_id>",
            "name": "<name>",
            "unit_sz": "<unit_sz>"
          }
        }
      }
    ]
  }
}
```

orders Collection (single entry):

```json
{
  "access_code": "<access_code>",
  "email_recipients": "<email_recipients>",
  "order_date": "<order_date>",
  "orders": [
    {
      "location": "<location>",
      "area": "<area>",
      "category": "<category>",
      "item_id": "<item_id>",
      "name": "<name>",
      "unit_sz": "<unit_sz>",
      "quantity": <quentity>
      // integer
      "timestamp": "<time sinze epoch>"
    }
  ]
}
```
