"use client";

import Image from "next/image";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Field,
  Input,
  NativeSelect,
  Radio,
  RadioGroup,
  Rating,
  Stepper,
  toast,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";
import { CHECKOUT_STEPS, PRODUCT, REVIEWS, SPECS, VARIANTS } from "./data";
import { placeholderArt } from "../../placeholder-art";

// Northlight — a commerce flow.
//
// Conversion-friendly without being manipulative: the stock line is a fact from
// the fixture rather than a fake countdown, the delivery estimate says five weeks
// when it is five weeks, and the checkout can always go back. The cart is real
// state, so adding two of something genuinely changes the total and the step the
// reader is on.
//
// The checkout is a stepper over local state, not a payment integration. No card
// number field exists anywhere on this page, on purpose.

export function NorthlightStore() {
  const { tcs } = useI18n();
  const [variantId, setVariantId] = useState(VARIANTS[0]!.id);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState(false);
  const [email, setEmail] = useState("");

  const variant = VARIANTS.find((entry) => entry.id === variantId) ?? VARIANTS[0]!;
  const subtotal = variant.price * quantity;

  const addToCart = () => {
    setStep(0);
    toast.success(tcs("Added to the basket"), {
      description: `${quantity} × ${PRODUCT.name} — ${variant.label}`,
    });
  };

  return (
    <div data-slot="northlight" className="grid gap-8 p-6 lg:grid-cols-2 lg:gap-12 lg:p-10">
      <div className="flex flex-col gap-4">
        <Image
          unoptimized
          {...placeholderArt(`northlight-${variant.id}`, PRODUCT.name)}
          alt={tcs("The {name} shown in {variant}").replace("{name}", PRODUCT.name).replace("{variant}", variant.label)}
          className="aspect-[4/3] w-full rounded-lg border border-line-subtle object-cover"
        />
        <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-4">
          {VARIANTS.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                aria-pressed={entry.id === variantId}
                onClick={() => setVariantId(entry.id)}
                className={
                  entry.id === variantId
                    ? "luc-focus luc-transition w-full rounded-sm border border-line-accent bg-accent-soft p-2 text-left"
                    : "luc-focus luc-transition w-full rounded-sm border border-line-subtle bg-surface-raised p-2 text-left hover:border-line-default"
                }
              >
                <Image
                  unoptimized
                  {...placeholderArt(`northlight-${entry.id}`, entry.label)}
                  alt=""
                  className="mb-2 aspect-square w-full rounded-xs object-cover"
                />
                <span className="block text-micro text-fg-secondary">{entry.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h2 className="font-display text-heading font-semibold text-fg-primary text-balance">
            {PRODUCT.name}
          </h2>
          <p className="max-w-[52ch] text-body text-fg-secondary text-pretty">
            {tcs(PRODUCT.standfirst)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Rating value={PRODUCT.rating} readOnly size="sm" allowHalf label={tcs("Average rating")} />
            <span className="text-caption text-fg-muted luc-numeric">
              {PRODUCT.reviewCount} {tcs("reviews")}
            </span>
          </div>
        </header>

        <div className="flex flex-col gap-2">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-display-sm font-semibold text-fg-primary luc-numeric">
              ${variant.price}
            </span>
            <span className="text-caption text-fg-muted">{PRODUCT.currency}</span>
          </span>
          <span className="flex items-center gap-2">
            <Badge
              tone={variant.stock === "in-stock" ? "positive" : variant.stock === "low" ? "warning" : "info"}
              size="sm"
              dot
            >
              {tcs(
                variant.stock === "in-stock"
                  ? "In stock"
                  : variant.stock === "low"
                    ? "Low stock"
                    : "Made to order",
              )}
            </Badge>
            <span className="text-caption text-fg-muted">{tcs(variant.note)}</span>
          </span>
        </div>

        <RadioGroup
          value={variantId}
          onValueChange={setVariantId}
          aria-label={tcs("Finish")}
          className="flex flex-col gap-2"
        >
          {VARIANTS.map((entry) => (
            <Radio
              key={entry.id}
              value={entry.id}
              label={entry.label}
              description={`$${entry.price} — ${tcs(entry.note)}`}
            />
          ))}
        </RadioGroup>

        <div className="flex flex-col gap-3 border-t border-line-subtle pt-4">
          <Field label={tcs("Quantity")}>
            <NativeSelect
              value={String(quantity)}
              onChange={(event) => setQuantity(Number(event.target.value))}
              options={[1, 2, 3, 4, 5].map((n) => ({
                value: String(n),
                label: `${n}${n === 1 ? ` ${tcs("lamp")}` : ` ${tcs("lamps")}`}`,
              }))}
            />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <span className="text-caption text-fg-muted">{tcs("Subtotal")}</span>
            <span className="text-title font-semibold text-fg-primary luc-numeric">${subtotal}</span>
          </div>
          <Button variant="accent" size="lg" onClick={addToCart}>
            {tcs("Add to basket")}
          </Button>
        </div>

        <section aria-labelledby="checkout" className="flex flex-col gap-4 rounded-md border border-line-subtle bg-surface-raised p-4">
          <h3 id="checkout" className="text-label font-semibold text-fg-primary">
            {tcs("Checkout")}
          </h3>
          <Stepper
            steps={CHECKOUT_STEPS.map((entry) => ({ id: entry.id, label: tcs(entry.label) }))}
            current={step}
            onStepSelect={setStep}
            showNumbers
          />
          {placed ? (
            <p className="rounded-sm border border-line-subtle bg-surface-sunken p-3 text-caption text-fg-secondary">
              {tcs(
                "Order placed. This demonstration stops here — there is no payment provider and no card field anywhere in Luc UI.",
              )}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {step === 0 ? (
                <p className="text-caption text-fg-secondary text-pretty">
                  {tcs(
                    "Your basket holds {count} item(s) totalling ${total}. Delivery is calculated on the next step.",
                  )
                    .replace("{count}", String(quantity))
                    .replace("{total}", String(subtotal))}
                </p>
              ) : null}
              {step === 1 ? (
                <Field label={tcs("Email for the receipt")} description={tcs("Used once, for this order.")}>
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>
              ) : null}
              {step === 2 ? (
                <p className="text-caption text-fg-secondary text-pretty">
                  {tcs(
                    "Payment would be collected here. No card number field exists in this demonstration on purpose.",
                  )}
                </p>
              ) : null}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={step === 0}
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                >
                  {tcs("Back")}
                </Button>
                {step < 2 ? (
                  <Button size="sm" variant="outline" onClick={() => setStep((current) => current + 1)}>
                    {tcs("Continue")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => {
                      setPlaced(true);
                      toast.success(tcs("Order placed"));
                    }}
                  >
                    {tcs("Place order")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>

        <Card variant="outline">
          <CardContent className="flex flex-col gap-3 p-4">
            <h3 className="text-label font-semibold text-fg-primary">{tcs("Specification")}</h3>
            <dl className="grid grid-cols-2 gap-3">
              {SPECS.map((spec) => (
                <div key={spec.id} className="flex flex-col">
                  <dt className="text-micro text-fg-muted">{tcs(spec.label)}</dt>
                  <dd className="text-label text-fg-primary luc-numeric">{spec.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-body text-fg-secondary text-pretty">{tcs(PRODUCT.description)}</p>
          </CardContent>
        </Card>

        <section aria-labelledby="reviews" className="flex flex-col gap-3">
          <h3 id="reviews" className="text-label font-semibold text-fg-primary">
            {tcs("Reviews")}
          </h3>
          <ul className="flex list-none flex-col gap-4">
            {REVIEWS.map((review) => (
              <li key={review.id} className="flex flex-col gap-1.5 border-t border-line-subtle pt-4">
                <span className="flex items-center gap-3">
                  <Rating value={review.score} readOnly size="sm" label={tcs("Rated {n} out of 5").replace("{n}", String(review.score))} />
                  <span className="text-caption font-medium text-fg-primary">{review.author}</span>
                </span>
                <p className="text-body text-fg-secondary text-pretty">{tcs(review.body)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
