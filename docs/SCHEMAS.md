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

Version 3
---
```
{
    "webApiManager": {
        "schema": 3,
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
        "shouldLog": "0" | "1" | "2" (a ShouldLogVal enum)
    }
}
```

Version 4
---
```
{
    "webApiManager": {
        "schema": 4,
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
        "shouldLog": "0" | "1" | "2" (a ShouldLogVal enum),
        "template": [
            integer id of a standard, taken from the info.id property,
            integer id of another standard, taken from the info.id property,
            etc...
        ]
    }
}
```

Version 5
---
```
    "webApiManager": {
        "schema": 5,
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
        "shouldLog": "0" | "1" | "2" (a ShouldLogVal enum),
        "template": [
            integer id of a standard, taken from the info.id property,
            integer id of another standard, taken from the info.id property,
            etc...
        ],
        "blockCrossFrame": (boolean)
    }
}
```

Version 6
---
```
    "webApiManager": {
        "schema": 5,
        "rules": [
            {
                "p": "the match pattern this rule applies to, <string>",
                "s": [
                    integer id of a standard, taken from the info.id property,
                    integer id of another standard, taken from the info.id property,
                    etc...
                ],
                "f": array of key paths (strings) of features that should be
                     blocked for standards that match this rule.
            },
            {
                "p": ...
                "s": [
                    ...
                ],
                "f": [...],
            },
            ...
        ],
        "shouldLog": "0" | "1" | "2" (a ShouldLogVal enum),
        "template": {
            "s": [
                integer id of a standard, taken from the info.id property,
                integer id of another standard, taken from the info.id property,
                etc...
            ],
            "f": array of key paths (strings) of features that should be
                 blocked for standards that match this rule.
        },
        "blockCrossFrame": (boolean)
    }
}
```