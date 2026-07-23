# Document API

## `POST /api/v1/documents`
- **Desc**: Create a new draft document.
- **Auth**: Author.
- **Body**: `{ title: string, body: string }`

## `PATCH /api/v1/documents/:id`
- **Desc**: Edit an existing draft. Ensures optimistic concurrency.
- **Auth**: Author (must be owner).
- **Body**: `{ title?: string, body?: string, version?: number }`

## `POST /api/v1/documents/:id/submit`
- **Desc**: Submit a draft for review.
- **Auth**: Author (must be owner).

## `GET /api/v1/documents`
- **Desc**: Search/list documents.
- **Params**: `page`, `limit`

## `GET /api/v1/documents/:id`
- **Desc**: Get document details, including history and metadata.
