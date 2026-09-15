import { useEffect } from "react";
import { useLocation } from "wouter";

export default function BookingRequestsRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/enquiries");
  }, [setLocation]);
  return null;
}
