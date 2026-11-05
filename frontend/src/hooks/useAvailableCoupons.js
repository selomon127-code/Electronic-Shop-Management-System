import { useEffect, useState } from "react";
import API from "../api/axios";

export default function useAvailableCoupons(options = {}) {
  const subtotal = typeof options === "number" ? options : options?.subtotal;
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = {};
    if (typeof subtotal === "number" && !Number.isNaN(subtotal) && subtotal >= 0) {
      params.subtotal = subtotal;
    }

    const config = Object.keys(params).length > 0 ? { params } : undefined;

    API.get("/coupons/available", config)
      .then(({ data }) => {
        if (active) setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Promotions are temporarily unavailable.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [subtotal]);

  return { coupons, loading, error };
}
