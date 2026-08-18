import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CalendarDays,
  Check,
  Clock3,
  Globe2,
  MapPin,
  Navigation,
  PackageCheck,
  Plane,
  Truck,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BookingMap } from '@/components/booking-map';
import { AppButton, Card, Field, Screen } from '@/components/ui';
import {
  OFFICE_SLUG,
  customerApi,
  type BookingPayload,
  type CustomerAddress,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/lib/theme';

const steps = ['Type', 'Pickup', 'Drop', 'Details', 'Package', 'Confirm'] as const;
type Step = 0 | 1 | 2 | 3 | 4 | 5;
type ShipmentType = 'domestic' | 'international';

type BookingForm = Omit<BookingPayload, 'shipmentType'> & {
  shipmentType: ShipmentType | null;
  destinationCountry: string;
  pickupLat: string | null;
  pickupLng: string | null;
  destinationLat: string | null;
  destinationLng: string | null;
};

type ResolvedMapAddress = {
  label: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ResolvedMapAddress> {
  if (googleMapsKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsKey}`,
      );
      const payload = await response.json();
      const result = payload.results?.[0];
      if (result) {
        const component = (type: string) =>
          result.address_components?.find((item: { types?: string[] }) =>
            item.types?.includes(type),
          )?.long_name || '';
        return {
          label: result.formatted_address || '',
          city:
            component('locality') ||
            component('postal_town') ||
            component('administrative_area_level_2'),
          state: component('administrative_area_level_1'),
          pincode: component('postal_code'),
          country: component('country'),
        };
      }
    } catch {
      // Fall through to the device geocoder.
    }
  }

  const places = await Location.reverseGeocodeAsync({ latitude, longitude });
  const place = places[0];
  if (!place) {
    return {
      label: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      city: '',
      state: '',
      pincode: '',
      country: '',
    };
  }
  return {
    label: [place.name, place.street, place.city, place.region, place.postalCode, place.country]
      .filter(Boolean)
      .join(', '),
    city: place.city || place.subregion || '',
    state: place.region || '',
    pincode: place.postalCode || '',
    country: place.country || '',
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingScreen() {
  const { token, user } = useAuth();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(0);
  const [submittedNumber, setSubmittedNumber] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [resolvingMap, setResolvingMap] = useState(false);
  const [form, setForm] = useState<BookingForm>({
    shipmentType: null,
    destinationCountry: '',
    senderName: user?.name || '',
    senderPhone: user?.phone || '',
    senderEmail: user?.email || '',
    senderAddress: user?.address || '',
    senderCity: user?.city || '',
    senderState: user?.state || '',
    senderPincode: user?.pincode || '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverCity: '',
    receiverState: '',
    receiverPincode: '',
    weight: '',
    numberOfPieces: 1,
    contentDescription: '',
    declaredValue: '',
    serviceType: 'surface',
    courierPreference: '',
    notes: '',
    pickupDate: today(),
    pickupTimeSlot: '09:00',
    pickupLat: null,
    pickupLng: null,
    pickupLocationName: null,
    destinationLat: null,
    destinationLng: null,
  });

  const isInternational = form.shipmentType === 'international';

  const addresses = useQuery({
    queryKey: ['customer-addresses', token],
    queryFn: () => customerApi.addresses(token!),
    enabled: !!token,
  });

  const pickupSettings = useQuery({
    queryKey: ['pickup-settings', OFFICE_SLUG],
    queryFn: () => customerApi.pickupSettings(),
  });

  const enabledSlots = useMemo(
    () => (pickupSettings.data?.slots || []).filter((slot) => slot.enabled),
    [pickupSettings.data],
  );

  const pickupSlotLabel = useMemo(() => {
    const match = enabledSlots.find((slot) => slot.value === form.pickupTimeSlot);
    return match?.label || form.pickupTimeSlot || 'Flexible';
  }, [enabledSlots, form.pickupTimeSlot]);

  useEffect(() => {
    if (!enabledSlots.length) return;
    if (!form.pickupTimeSlot || !enabledSlots.some((slot) => slot.value === form.pickupTimeSlot)) {
      setForm((current) => ({ ...current, pickupTimeSlot: enabledSlots[0].value }));
    }
  }, [enabledSlots, form.pickupTimeSlot]);

  const submit = useMutation({
    mutationFn: () => {
      const { destinationLat: _dLat, destinationLng: _dLng, ...payload } = form;
      return customerApi.createBooking(token!, {
        ...payload,
        shipmentType: form.shipmentType || 'domestic',
        destinationCountry: isInternational
          ? form.destinationCountry.trim()
          : 'India',
        serviceType: isInternational ? form.serviceType || 'air' : form.serviceType,
      });
    },
    onSuccess: (result) => {
      setSubmittedNumber(result.requestNumber);
      void queryClient.invalidateQueries({ queryKey: ['customer-bookings', token] });
    },
    onError: (error) =>
      Alert.alert('Booking could not be submitted', error instanceof Error ? error.message : 'Try again.'),
  });

  const update = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const chooseShipmentType = (type: ShipmentType) => {
    setForm((current) => ({
      ...current,
      shipmentType: type,
      serviceType: type === 'international' ? 'air' : current.serviceType === 'air' ? 'air' : 'surface',
      destinationCountry: type === 'domestic' ? 'India' : current.destinationCountry === 'India' ? '' : current.destinationCountry,
      receiverAddress: type !== current.shipmentType ? '' : current.receiverAddress,
      receiverCity: type !== current.shipmentType ? '' : current.receiverCity,
      receiverState: type !== current.shipmentType ? '' : current.receiverState,
      receiverPincode: type !== current.shipmentType ? '' : current.receiverPincode,
      destinationLat: type !== current.shipmentType ? null : current.destinationLat,
      destinationLng: type !== current.shipmentType ? null : current.destinationLng,
    }));
  };

  const selectAddress = (address: CustomerAddress, type: 'sender' | 'receiver') => {
    if (type === 'sender') {
      setForm((current) => ({
        ...current,
        senderName: address.name,
        senderPhone: address.phone,
        senderAddress: address.address,
        senderCity: address.city || '',
        senderState: address.state || '',
        senderPincode: address.pincode || '',
        pickupLat: address.lat || null,
        pickupLng: address.lng || null,
        pickupLocationName: address.label,
      }));
    } else {
      setForm((current) => ({
        ...current,
        receiverName: address.name,
        receiverPhone: address.phone,
        receiverAddress: address.address,
        receiverCity: address.city || '',
        receiverState: address.state || '',
        receiverPincode: address.pincode || '',
        destinationLat: address.lat || null,
        destinationLng: address.lng || null,
      }));
    }
  };

  const locate = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Location permission needed',
          'Open phone Settings → Apps → XGoo → Permissions and allow location while using the app.',
        );
        return;
      }
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 60_000,
        requiredAccuracy: 500,
      });
      const location =
        lastKnown ||
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }));
      await applyMapPoint(
        'sender',
        location.coords.latitude,
        location.coords.longitude,
      );
    } catch (error) {
      Alert.alert(
        'Could not fetch live location',
        error instanceof Error
          ? error.message
          : 'Turn on GPS and internet access, then try again.',
      );
    } finally {
      setLocating(false);
    }
  };

  const applyMapPoint = async (
    type: 'sender' | 'receiver',
    latitude: number,
    longitude: number,
  ) => {
    setResolvingMap(true);
    try {
      const address = await reverseGeocode(latitude, longitude);
      setForm((current) =>
        type === 'sender'
          ? {
              ...current,
              pickupLat: String(latitude),
              pickupLng: String(longitude),
              pickupLocationName: address.label,
              senderAddress: address.label || current.senderAddress,
              senderCity: address.city || current.senderCity,
              senderState: address.state || current.senderState,
              senderPincode: address.pincode || current.senderPincode,
            }
          : {
              ...current,
              destinationLat: String(latitude),
              destinationLng: String(longitude),
              receiverAddress: address.label || current.receiverAddress,
              receiverCity: address.city || current.receiverCity,
              receiverState: address.state || current.receiverState,
              receiverPincode: address.pincode || current.receiverPincode,
              destinationCountry:
                current.shipmentType === 'international'
                  ? address.country || current.destinationCountry
                  : current.destinationCountry,
            },
      );
    } catch {
      Alert.alert(
        'Address lookup failed',
        'The pin was selected, but its address could not be found. Enter the address below.',
      );
    } finally {
      setResolvingMap(false);
    }
  };

  const canContinue = useMemo(() => {
    if (step === 0) return form.shipmentType === 'domestic' || form.shipmentType === 'international';
    if (step === 1) return !!form.senderAddress.trim();
    if (step === 2) {
      if (isInternational) {
        return (
          !!form.destinationCountry.trim() &&
          !!form.receiverAddress.trim() &&
          !!(form.receiverCity || '').trim()
        );
      }
      return !!form.receiverAddress.trim();
    }
    if (step === 3) {
      return (
        !!form.senderName.trim() &&
        form.senderPhone.trim().length >= 10 &&
        !!form.receiverName.trim() &&
        form.receiverPhone.trim().length >= 8 &&
        !!form.pickupTimeSlot
      );
    }
    if (step === 4) {
      return (
        Number(form.weight) > 0 &&
        form.numberOfPieces > 0 &&
        !!form.contentDescription.trim()
      );
    }
    return true;
  }, [form, isInternational, step]);

  const next = () => {
    if (!canContinue) {
      const messages = [
        'Choose Domestic or International to continue.',
        'Enter the pickup address or use Live location.',
        isInternational
          ? 'Enter destination country, full address, and city. Map pin is optional.'
          : 'Enter the receiver’s delivery address. This is different from the pickup address.',
        'Enter valid sender and receiver names and phone numbers.',
        'Enter parcel weight, number of pieces, and package contents.',
        '',
      ];
      Alert.alert('Complete this step', messages[step]);
      return;
    }
    setStep((current) => Math.min(5, current + 1) as Step);
  };

  if (submittedNumber) {
    return (
      <Screen scroll={false} contentStyle={styles.successScreen}>
        <View style={[styles.successIcon, { backgroundColor: colors.accentSoft }]}>
          <PackageCheck size={54} color={colors.accent} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>Booking submitted</Text>
        <Text style={[styles.successCopy, { color: colors.textMuted }]}>
          We received your {isInternational ? 'international' : 'domestic'} parcel request. Our team will review and confirm the pickup.
        </Text>
        <Card style={styles.requestCard}>
          <Text style={[styles.requestLabel, { color: colors.textMuted }]}>REQUEST NUMBER</Text>
          <Text style={[styles.requestNumber, { color: colors.text }]}>#{submittedNumber}</Text>
        </Card>
        <View style={styles.successActions}>
          <AppButton
            title="View shipments"
            onPress={() => router.replace('/(tabs)/shipments')}
          />
          <AppButton
            title="Back to home"
            variant="secondary"
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen keyboard contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            step > 0 ? setStep((step - 1) as Step) : router.replace('/(tabs)')
          }
          style={styles.back}
        >
          <ArrowLeft size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Book a parcel</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Step {step + 1} of {steps.length} · {steps[step]}
            {form.shipmentType
              ? ` · ${form.shipmentType === 'international' ? 'International' : 'Domestic'}`
              : ''}
          </Text>
        </View>
      </View>

      <View style={styles.progress}>
        {steps.map((item, index) => (
          <View key={item} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= step ? colors.accent : colors.surfaceMuted,
                  borderColor: index <= step ? colors.accent : colors.border,
                },
              ]}
            >
              {index < step ? <Check size={11} color="#FFFFFF" /> : <Text style={styles.dotText}>{index + 1}</Text>}
            </View>
            {index < steps.length - 1 ? (
              <View
                style={[
                  styles.progressLine,
                  { backgroundColor: index < step ? colors.accent : colors.border },
                ]}
              />
            ) : null}
          </View>
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.stepBody}>
          <StepHeading
            icon={Globe2}
            title="Where are you sending?"
            copy="Choose domestic for India deliveries, or international for overseas destinations."
          />
          <View style={styles.services}>
            <ServiceCard
              icon={Truck}
              title="Domestic"
              copy="Pickup and delivery within India"
              active={form.shipmentType === 'domestic'}
              onPress={() => chooseShipmentType('domestic')}
            />
            <ServiceCard
              icon={Plane}
              title="International"
              copy="Ship from India to another country"
              active={form.shipmentType === 'international'}
              onPress={() => chooseShipmentType('international')}
            />
          </View>
          <Card style={[styles.notice, { backgroundColor: colors.surfaceMuted }]}>
            <MapPin size={18} color={colors.accent} />
            <Text style={[styles.noticeText, { color: colors.text }]}>
              {form.shipmentType === 'international'
                ? 'Next you’ll set pickup in India, then enter the overseas destination manually.'
                : form.shipmentType === 'domestic'
                  ? 'Next you’ll set pickup and delivery addresses across India.'
                  : 'Select one option to continue booking.'}
            </Text>
          </Card>
        </View>
      ) : null}

      {step === 1 ? (
        <LocationStep
          title="Set the pickup address"
          hint="Use live location, tap the map, choose a saved pickup, or type the sender’s address in India."
          type="sender"
          mode="domestic"
          addresses={(addresses.data || []).filter((item) => item.addressType === 'sender')}
          onSelect={selectAddress}
          fields={{
            address: form.senderAddress,
            city: form.senderCity || '',
            state: form.senderState || '',
            pincode: form.senderPincode || '',
            country: '',
          }}
          onField={(key, value) => {
            if (key === 'Country') return;
            update(`sender${key}` as keyof BookingForm, value as never);
          }}
          accent={colors.accent}
        >
          <View style={[styles.mapWrap, { borderColor: colors.border }]}>
            <BookingMap
              latitude={form.pickupLat ? Number(form.pickupLat) : null}
              longitude={form.pickupLng ? Number(form.pickupLng) : null}
              markerColor={colors.accent}
              onMapPress={(latitude, longitude) =>
                void applyMapPoint('sender', latitude, longitude)
              }
            />
            <Pressable
              disabled={locating}
              style={[
                styles.locate,
                { backgroundColor: colors.surface },
                locating && styles.actionDisabled,
              ]}
              onPress={locate}
            >
              <Navigation size={18} color={colors.accent} />
              <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
                {locating ? 'Finding location…' : 'Use live location'}
              </Text>
            </Pressable>
            {resolvingMap ? (
              <View style={[styles.mapStatus, { backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                  Finding address…
                </Text>
              </View>
            ) : null}
          </View>
        </LocationStep>
      ) : null}

      {step === 2 ? (
        <View style={styles.stepBody}>
          <Card style={[styles.confirmedPickup, { backgroundColor: colors.accentSoft }]}>
            <View style={[styles.confirmedDot, { backgroundColor: colors.accent }]}>
              <Check size={11} color="#FFFFFF" />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.confirmedLabel, { color: colors.accent }]}>
                PICKUP CONFIRMED
              </Text>
              <Text numberOfLines={2} style={[styles.confirmedAddress, { color: colors.text }]}>
                {form.senderAddress}
              </Text>
            </View>
          </Card>
          <LocationStep
            title={isInternational ? 'Enter overseas destination' : 'Set the delivery address'}
            hint={
              isInternational
                ? 'Type the destination country and full address. You can also place an optional pin on the map.'
                : 'Now enter the receiver’s destination. Your pickup address is already saved above.'
            }
            type="receiver"
            mode={isInternational ? 'international' : 'domestic'}
            addresses={
              isInternational
                ? []
                : (addresses.data || []).filter((item) => item.addressType === 'receiver')
            }
            onSelect={selectAddress}
            fields={{
              address: form.receiverAddress,
              city: form.receiverCity || '',
              state: form.receiverState || '',
              pincode: form.receiverPincode || '',
              country: form.destinationCountry || '',
            }}
            onField={(key, value) => {
              if (key === 'Country') {
                update('destinationCountry', value);
                return;
              }
              update(`receiver${key}` as keyof BookingForm, value as never);
            }}
            accent={colors.success}
            manualFirst={isInternational}
          >
            <View style={[styles.mapWrap, { borderColor: colors.border }]}>
              <BookingMap
                latitude={form.destinationLat ? Number(form.destinationLat) : null}
                longitude={form.destinationLng ? Number(form.destinationLng) : null}
                markerColor={colors.success}
                onMapPress={(latitude, longitude) =>
                  void applyMapPoint('receiver', latitude, longitude)
                }
              />
              {resolvingMap ? (
                <View style={[styles.mapStatus, { backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                    Finding delivery address…
                  </Text>
                </View>
              ) : null}
            </View>
            {isInternational ? (
              <Text style={[styles.mapHint, { color: colors.textMuted }]}>
                Map is optional for international destinations. Enter country and address manually if the pin is unsure.
              </Text>
            ) : null}
          </LocationStep>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.stepBody}>
          <StepHeading
            icon={UserRound}
            title="Contact and pickup details"
            copy="Tell us who is sending, receiving, and when we can collect."
          />
          <Text style={[styles.groupTitle, { color: colors.text }]}>Sender</Text>
          <Field label="Name" value={form.senderName} onChangeText={(value) => update('senderName', value)} />
          <Field
            label="Phone"
            keyboardType="phone-pad"
            value={form.senderPhone}
            onChangeText={(value) => update('senderPhone', value)}
          />
          <Text style={[styles.groupTitle, { color: colors.text }]}>Receiver</Text>
          <Field label="Name" value={form.receiverName} onChangeText={(value) => update('receiverName', value)} />
          <Field
            label={isInternational ? 'Phone (with country code)' : 'Phone'}
            keyboardType="phone-pad"
            value={form.receiverPhone}
            onChangeText={(value) => update('receiverPhone', value)}
            placeholder={isInternational ? 'e.g. 14155552671' : undefined}
          />
          <Text style={[styles.groupTitle, { color: colors.text }]}>Pickup schedule</Text>
          <Field
            label="Date"
            value={form.pickupDate || ''}
            onChangeText={(value) => update('pickupDate', value)}
            placeholder="YYYY-MM-DD"
          />
          <Text style={[styles.slotLabel, { color: colors.textMuted }]}>Pickup time</Text>
          <View style={styles.slotGrid}>
            {enabledSlots.map((slot) => {
              const active = form.pickupTimeSlot === slot.value;
              return (
                <Pressable
                  key={slot.value}
                  onPress={() => update('pickupTimeSlot', slot.value)}
                  style={[
                    styles.slotChip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accentSoft : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.accent : colors.text,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {slot.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {pickupSettings.data?.cutoffNote ? (
            <Card style={[styles.notice, { backgroundColor: colors.accentSoft }]}>
              <Clock3 size={18} color={colors.accent} />
              <Text style={[styles.noticeText, { color: colors.text }]}>
                {pickupSettings.data.cutoffNote}
              </Text>
            </Card>
          ) : null}
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.stepBody}>
          <StepHeading
            icon={Box}
            title="Parcel and service"
            copy="Package details help us plan the right movement."
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Field
                label="Weight (kg)"
                keyboardType="decimal-pad"
                value={form.weight}
                onChangeText={(value) => update('weight', value)}
                placeholder="1.5"
              />
            </View>
            <View style={styles.flex}>
              <Field
                label="Pieces"
                keyboardType="number-pad"
                value={String(form.numberOfPieces)}
                onChangeText={(value) => update('numberOfPieces', Math.max(1, Number(value) || 1))}
              />
            </View>
          </View>
          <Field
            label="Package contents"
            value={form.contentDescription}
            onChangeText={(value) => update('contentDescription', value)}
            placeholder="Documents, clothes, electronics..."
          />
          <Field
            label="Declared value (₹)"
            keyboardType="decimal-pad"
            value={form.declaredValue || ''}
            onChangeText={(value) => update('declaredValue', value)}
            placeholder="Optional"
          />
          <Text style={[styles.groupTitle, { color: colors.text }]}>Delivery service</Text>
          <View style={styles.services}>
            <ServiceCard
              icon={Truck}
              title="Surface"
              copy={isInternational ? 'Not typical overseas' : 'Economical movement'}
              active={form.serviceType === 'surface'}
              onPress={() => update('serviceType', 'surface')}
            />
            <ServiceCard
              icon={Plane}
              title="Air"
              copy={isInternational ? 'Recommended overseas' : 'Faster delivery'}
              active={form.serviceType === 'air'}
              onPress={() => update('serviceType', 'air')}
            />
          </View>
          <Field
            label="Notes"
            multiline
            value={form.notes || ''}
            onChangeText={(value) => update('notes', value)}
            placeholder="Handling instructions (optional)"
          />
        </View>
      ) : null}

      {step === 5 ? (
        <View style={styles.stepBody}>
          <StepHeading
            icon={PackageCheck}
            title="Review your booking"
            copy="Confirm every detail before submitting."
          />
          <ReviewCard
            icon={Globe2}
            title="Shipment type"
            lines={[
              form.shipmentType === 'international' ? 'International' : 'Domestic',
              isInternational
                ? `Destination country · ${form.destinationCountry}`
                : 'Within India',
            ]}
            onEdit={() => setStep(0)}
          />
          <ReviewCard
            icon={MapPin}
            title="Route"
            lines={[
              `${form.senderAddress}${form.senderCity ? `, ${form.senderCity}` : ''}`,
              isInternational
                ? `${form.receiverAddress}${form.receiverCity ? `, ${form.receiverCity}` : ''}${form.destinationCountry ? `, ${form.destinationCountry}` : ''}`
                : `${form.receiverAddress}${form.receiverCity ? `, ${form.receiverCity}` : ''}`,
            ]}
            onEdit={() => setStep(1)}
          />
          <ReviewCard
            icon={UserRound}
            title="Contacts"
            lines={[
              `${form.senderName} · ${form.senderPhone}`,
              `${form.receiverName} · ${form.receiverPhone}`,
            ]}
            onEdit={() => setStep(3)}
          />
          <ReviewCard
            icon={Box}
            title="Parcel"
            lines={[
              `${form.weight} kg · ${form.numberOfPieces} piece(s)`,
              `${form.contentDescription} · ${form.serviceType === 'air' ? 'Air' : 'Surface'}`,
            ]}
            onEdit={() => setStep(4)}
          />
          <ReviewCard
            icon={CalendarDays}
            title="Pickup"
            lines={[`${form.pickupDate || 'To be confirmed'} · ${pickupSlotLabel}`]}
            onEdit={() => setStep(3)}
          />
          <Card style={[styles.notice, { backgroundColor: colors.accentSoft }]}>
            <Clock3 size={19} color={colors.accent} />
            <Text style={[styles.noticeText, { color: colors.text }]}>
              This submits a booking request. XGoo will confirm serviceability, final price, and pickup.
            </Text>
          </Card>
        </View>
      ) : null}

      <View style={styles.footer}>
        {step < 5 ? (
          <AppButton
            title={
              [
                'Continue to pickup',
                'Continue to delivery',
                'Continue to contacts',
                'Continue to parcel',
                'Review booking',
              ][step]
            }
            icon={ArrowRight}
            onPress={next}
          />
        ) : (
          <AppButton
            title="Confirm booking"
            icon={Check}
            loading={submit.isPending}
            onPress={() => submit.mutate()}
          />
        )}
      </View>
    </Screen>
  );
}

function LocationStep({
  title,
  hint,
  type,
  mode,
  addresses,
  onSelect,
  fields,
  onField,
  accent,
  children,
  manualFirst = false,
}: {
  title: string;
  hint: string;
  type: 'sender' | 'receiver';
  mode: 'domestic' | 'international';
  addresses: CustomerAddress[];
  onSelect: (address: CustomerAddress, type: 'sender' | 'receiver') => void;
  fields: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  onField: (
    key: 'Address' | 'City' | 'State' | 'Pincode' | 'Country',
    value: string,
  ) => void;
  accent: string;
  children?: React.ReactNode;
  manualFirst?: boolean;
}) {
  const { colors } = useAppTheme();
  const formFields = (
    <>
      <Text style={[styles.groupTitle, { color: colors.text }]}>
        {type === 'sender'
          ? 'Pickup address details'
          : mode === 'international'
            ? 'Destination address details'
            : 'Delivery address details'}
      </Text>
      {mode === 'international' && type === 'receiver' ? (
        <Field
          label="Country"
          value={fields.country}
          onChangeText={(value) => onField('Country', value)}
          placeholder="e.g. United States, UAE, Canada"
        />
      ) : null}
      <Field
        label={
          type === 'sender'
            ? 'Pickup full address'
            : mode === 'international'
              ? 'Full destination address'
              : 'Receiver full address'
        }
        multiline
        value={fields.address}
        onChangeText={(value) => onField('Address', value)}
        placeholder={
          mode === 'international'
            ? 'Street, building, area, landmark'
            : 'House/building, street, area'
        }
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Field label="City" value={fields.city} onChangeText={(value) => onField('City', value)} />
        </View>
        <View style={styles.flex}>
          <Field
            label={mode === 'international' ? 'Postal code' : 'Pincode'}
            value={fields.pincode}
            keyboardType={mode === 'international' ? 'default' : 'number-pad'}
            onChangeText={(value) => onField('Pincode', value)}
          />
        </View>
      </View>
      <Field
        label={mode === 'international' ? 'State / Province / Region' : 'State'}
        value={fields.state}
        onChangeText={(value) => onField('State', value)}
      />
    </>
  );

  const addressesBlock = addresses.length ? (
    <>
      <Text style={[styles.groupTitle, { color: colors.text }]}>Saved addresses</Text>
      <View style={styles.savedList}>
        {addresses.map((address) => (
          <Card key={address.id} onPress={() => onSelect(address, type)} style={styles.savedCard}>
            <View style={[styles.savedIcon, { backgroundColor: `${accent}18` }]}>
              <MapPin size={17} color={accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.savedTitle, { color: colors.text }]}>{address.label}</Text>
              <Text numberOfLines={1} style={[styles.savedText, { color: colors.textMuted }]}>
                {[address.address, address.city].filter(Boolean).join(', ')}
              </Text>
            </View>
            {address.isDefault ? <Check size={17} color={accent} /> : null}
          </Card>
        ))}
      </View>
    </>
  ) : null;

  return (
    <View style={styles.stepBody}>
      <StepHeading icon={MapPin} title={title} copy={hint} />
      {manualFirst ? (
        <>
          {formFields}
          {addressesBlock}
          {children}
        </>
      ) : (
        <>
          {children}
          {addressesBlock}
          {formFields}
        </>
      )}
    </View>
  );
}

function StepHeading({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof MapPin;
  title: string;
  copy: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stepHeading}>
      <View style={[styles.stepIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon size={23} color={colors.accent} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.stepCopy, { color: colors.textMuted }]}>{copy}</Text>
      </View>
    </View>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  copy,
  active,
  onPress,
}: {
  icon: typeof Truck;
  title: string;
  copy: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.service,
        {
          borderColor: active ? colors.accent : colors.border,
          backgroundColor: active ? colors.accentSoft : colors.surface,
        },
      ]}
    >
      <Icon size={24} color={active ? colors.accent : colors.textMuted} />
      <Text style={[styles.serviceTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.serviceCopy, { color: colors.textMuted }]}>{copy}</Text>
      {active ? (
        <View style={[styles.serviceCheck, { backgroundColor: colors.accent }]}>
          <Check size={11} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

function ReviewCard({
  icon: Icon,
  title,
  lines,
  onEdit,
}: {
  icon: typeof MapPin;
  title: string;
  lines: string[];
  onEdit: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Card style={styles.review}>
      <View style={[styles.reviewIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Icon size={19} color={colors.accent} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.reviewTitle, { color: colors.text }]}>{title}</Text>
        {lines.map((line, index) => (
          <Text key={`${line}-${index}`} style={[styles.reviewLine, { color: colors.textMuted }]}>
            {line}
          </Text>
        ))}
      </View>
      <Pressable onPress={onEdit}>
        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>Edit</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 42, height: 42, justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 2 },
  progress: { flexDirection: 'row', marginTop: 20, marginBottom: 26, paddingHorizontal: 5 },
  progressItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 25,
    height: 25,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 10, color: '#FFFFFF', fontWeight: '800' },
  progressLine: { flex: 1, height: 2 },
  stepBody: { gap: 14 },
  stepHeading: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 2 },
  stepIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 19, fontWeight: '800' },
  stepCopy: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  groupTitle: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  slotLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  mapWrap: { height: 210, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  mapHint: { fontSize: 10, lineHeight: 15, marginTop: -4 },
  confirmedPickup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  confirmedDot: {
    width: 25,
    height: 25,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  confirmedAddress: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  locate: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderRadius: 12,
    paddingHorizontal: 11,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 4,
  },
  mapStatus: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    elevation: 3,
  },
  actionDisabled: { opacity: 0.65 },
  savedList: { gap: 8 },
  savedCard: { padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 0 },
  savedIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  savedTitle: { fontSize: 13, fontWeight: '700' },
  savedText: { fontSize: 10, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  services: { flexDirection: 'row', gap: 10 },
  service: { flex: 1, borderWidth: 1, borderRadius: 17, padding: 15, minHeight: 122 },
  serviceTitle: { fontSize: 15, fontWeight: '700', marginTop: 11 },
  serviceCopy: { fontSize: 10, marginTop: 3 },
  serviceCheck: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 20,
    height: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  review: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  reviewIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reviewTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  reviewLine: { fontSize: 11, lineHeight: 16 },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', elevation: 0, shadowOpacity: 0 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17 },
  footer: { marginTop: 24 },
  successScreen: { alignItems: 'center', justifyContent: 'center', paddingBottom: 24 },
  successIcon: { width: 108, height: 108, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 28, fontWeight: '900', marginTop: 24 },
  successCopy: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, paddingHorizontal: 20 },
  requestCard: { width: '100%', alignItems: 'center', marginTop: 25 },
  requestLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  requestNumber: { fontSize: 22, fontWeight: '900', marginTop: 5 },
  successActions: { width: '100%', gap: 10, marginTop: 24 },
});
