import { getValidCanvaAccessToken } from "./oauth";

const CANVA_API = "https://api.canva.com/rest/v1";

const FONTS = [
  { code: "PF01", name: "Style Casual", page: 1 },
  { code: "PF02", name: "Nexa Script", page: 2 },
  { code: "PF03", name: "Style Script", page: 3 },
  { code: "PF04", name: "Signatra Demo", page: 4 },
  { code: "PF05", name: "Brush Script", page: 5 },
  { code: "PF06", name: "Oleo Script", page: 6 },
  { code: "PF07", name: "Stars & Love", page: 7 },
  { code: "PF08", name: "Monarda", page: 8 },
] as const;

type CanvaJob = {
  job?: {
    id?: string;
    status?: string;
    result?: {
      design?: {
        id?: string;
      };
    };
    urls?: string[];
    error?: {
      message?: string;
    };
  };
};

type CanvaDataset = {
  dataset?: Record<
    string,
    {
      type?: string;
    }
  >;
};

function getDesignId() {
  const designId = process.env.CANVA_VINYL_DESIGN_ID;

  if (!designId) {
    throw new Error(
      "CANVA_VINYL_DESIGN_ID is not configured."
    );
  }

  return designId;
}

async function canvaCall<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${CANVA_API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      "Canva API request failed:",
      path,
      response.status,
      data
    );

    throw new Error(
      `Canva request failed (${response.status}).`
    );
  }

  return data as T;
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function verifyVinylDataset(
  designId: string,
  token: string
) {
  const result = await canvaCall<CanvaDataset>(
    `/designs/${encodeURIComponent(designId)}/dataset`,
    token
  );

  const vinylText = result.dataset?.VINYL_TEXT;

  if (!vinylText) {
    throw new Error(
      'The Canva design does not contain the Autofill field "VINYL_TEXT".'
    );
  }

  if (vinylText.type !== "text") {
    throw new Error(
      'The Canva Autofill field "VINYL_TEXT" must be a text field.'
    );
  }
}

async function waitForDesign(
  jobId: string,
  token: string
) {
  for (let i = 0; i < 30; i++) {
    const data = await canvaCall<CanvaJob>(
      `/autofills/${encodeURIComponent(jobId)}`,
      token
    );

    if (data.job?.status === "success") {
      const id = data.job.result?.design?.id;

      if (!id) {
        throw new Error(
          "Canva Autofill returned no design ID."
        );
      }

      return id;
    }

    if (data.job?.status === "failed") {
      throw new Error(
        data.job.error?.message || "Canva Autofill failed."
      );
    }

    await sleep(1000);
  }

  throw new Error("Canva Autofill timed out.");
}

async function waitForExport(
  jobId: string,
  token: string
) {
  for (let i = 0; i < 30; i++) {
    const data = await canvaCall<CanvaJob>(
      `/exports/${encodeURIComponent(jobId)}`,
      token
    );

    if (data.job?.status === "success") {
      if (!data.job.urls?.length) {
        throw new Error(
          "Canva export returned no images."
        );
      }

      return data.job.urls;
    }

    if (data.job?.status === "failed") {
      throw new Error(
        data.job.error?.message || "Canva export failed."
      );
    }

    await sleep(1000);
  }

  throw new Error("Canva export timed out.");
}

export async function generateVinylFontPreviews(
  content: string
) {
  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new Error("Vinyl text cannot be empty.");
  }

  if (cleanContent.length > 100) {
    throw new Error(
      "Vinyl text cannot exceed 100 characters."
    );
  }

  const designId = getDesignId();

  /*
   * No CANVA_ACCESS_TOKEN environment variable.
   *
   * This automatically:
   * - reads the stored access token
   * - checks its expiry
   * - refreshes when required
   * - saves Canva's newly rotated refresh token
   */
  const accessToken =
    await getValidCanvaAccessToken();

  /*
   * Verify that your Canva master design still contains
   * VINYL_TEXT before generating a customer preview.
   */
  await verifyVinylDataset(
    designId,
    accessToken
  );

  const autofill = await canvaCall<CanvaJob>(
    "/autofills",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        type: "create_from_design",
        design_id: designId,

        data: {
          VINYL_TEXT: {
            type: "text",
            text: cleanContent,
          },
        },

        title: `PurelyJid Vinyl - ${cleanContent.slice(
          0,
          50
        )}`,
      }),
    }
  );

  if (!autofill.job?.id) {
    throw new Error(
      "Canva returned no Autofill job ID."
    );
  }

  const generatedDesignId =
    await waitForDesign(
      autofill.job.id,
      accessToken
    );

  const exported = await canvaCall<CanvaJob>(
    "/exports",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        design_id: generatedDesignId,

        format: {
          type: "png",
          pages: FONTS.map(
            (font) => font.page
          ),
          as_single_image: false,
        },
      }),
    }
  );

  if (!exported.job?.id) {
    throw new Error(
      "Canva returned no export job ID."
    );
  }

  const urls = await waitForExport(
    exported.job.id,
    accessToken
  );

  if (urls.length < FONTS.length) {
    throw new Error(
      `Canva returned ${urls.length} previews; expected ${FONTS.length}.`
    );
  }

  return FONTS.map((font, index) => ({
    code: font.code,
    name: font.name,
    imageUrl: urls[index],
  }));
}
