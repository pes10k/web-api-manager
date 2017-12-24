Schemas
===

Purpose
---
This document describes the different ways that user preferences were serialized
to storage. This is mostly useful to understand the migrations performed by
`add-on/lib/migrations.js`.

The below data structures match exactly what stored in `storage.set`, and
so match what should be returned by `storage.get("webApiManager", callback)`.

Version 1
---
```
{
    "webApiManager": {
        "domainRules": {
            "first match pattern <string>": [
                "id of a standard, taken from the info.id property of the standard definition",
                "id of another standard, taken from the info.id property of the standard definition",
                etc...
            ],
            "second match pattern <string>": [...],
            etc…
        },
        "shouldLog": <boolean>
    }
}
```

Version 2
---
```
{
    "webApiManager": {
        "schema": 2,
        "rules": [
            {
                "p": "the match pattern this rule applies to, <string>",
                "s": [
                    integer id of a standard, taken from the info.id property,
                    integer id of another standard, taken from the info.id property,
                    etc...
                ]
            },
            {
                "p": ...
                "s": [
                    ...
                ]
            },
            ...
        ],
        "shouldLog": <boolean>
    }
}
```