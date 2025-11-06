-- CreateTable
CREATE TABLE "documents" (
    "id" VARCHAR(255) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_codes" (
    "code" VARCHAR(255) NOT NULL,
    "document_id" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "access_codes_pkey" PRIMARY KEY ("code")
);

-- AddForeignKey
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
