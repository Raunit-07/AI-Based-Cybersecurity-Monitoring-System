export const parseNginxLog = (line) => {
  try {
    if (!line) return null;

    /**
     * ============================================
     * CLEAN INPUT
     * ============================================
     */
    line = line.trim();

    /**
     * ============================================
     * REAL NGINX ACCESS LOG FORMAT
     * ============================================
     *
     * 127.0.0.1 - - [11/May/2026:11:06:47 +0530]
     * "GET / HTTP/1.1" 304 0 "-"
     * "Mozilla/5.0 ..."
     */

    const regex =
      /^(\S+)\s-\s-\s\[(.*?)\]\s"(\S+)\s(.*?)\sHTTP\/[\d.]+"\s(\d+)\s(\d+)\s"(.*?)"\s"(.*?)"$/;

    const match = line.match(regex);

    /**
     * ============================================
     * REGEX FAILED
     * ============================================
     */
    if (!match) {
      console.log("❌ REGEX FAILED");
      console.log(line);

      return null;
    }

    /**
     * ============================================
     * EXTRACT VALUES
     * ============================================
     */
    const [
      _,
      ip,
      nginxTimestamp,
      method,
      endpoint,
      statusCode,
      bytes,
      referrer,
      userAgent,
    ] = match;

    /**
     * ============================================
     * DEBUG LOG
     * ============================================
     */
    console.log("✅ PARSED LOG:", {
      ip,
      nginxTimestamp,
      method,
      endpoint,
      statusCode,
    });

    /**
     * ============================================
     * RETURN NORMALIZED LOG
     * ============================================
     */
    return {
      /**
       * REQUIRED FIELDS
       */
      ip: ip || "127.0.0.1",

      method: method || "GET",

      endpoint: endpoint || "/",

      /**
       * IMPORTANT FIX
       *
       * MongoDB requires valid Date
       */
      timestamp: new Date(),

      /**
       * STATUS
       */
      statusCode:
        Number(statusCode) || 200,

      /**
       * REQUEST COUNT
       */
      requests: 1,

      /**
       * RESPONSE SIZE
       */
      bytes: Number(bytes) || 0,

      /**
       * OPTIONAL FIELDS
       */
      user_agent:
        userAgent || "Unknown",

      referrer:
        referrer || "-",

      /**
       * RAW NGINX TIMESTAMP
       * useful for debugging
       */
      raw_timestamp:
        nginxTimestamp,
    };
  } catch (error) {
    console.error(
      "❌ Parser error:",
      error.message
    );

    return null;
  }
};