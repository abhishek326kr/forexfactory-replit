import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, HelpCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { generateFAQPageSchema } from '@/lib/seo';

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });

  // Submit contact form mutation
  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  const faqs = [
    {
      question: "How do I install an Expert Advisor in MT4/MT5?",
      answer: "Download the EA file, open MetaTrader, go to File → Open Data Folder, navigate to MQL4/Experts (or MQL5/Experts), copy the EA file there, restart MetaTrader, and attach the EA to a chart."
    },
    {
      question: "Are the Expert Advisors really free?",
      answer: "Yes! All Expert Advisors on ForexFactory.cc are 100% free to download and use. We believe in democratizing algorithmic trading for everyone."
    },
    {
      question: "Do I need a VPS to run Expert Advisors?",
      answer: "While not required, a VPS is recommended for 24/7 operation. You can run EAs on your personal computer, but they will only trade when MetaTrader is running."
    },
    {
      question: "How can I test an EA before using it on a live account?",
      answer: "Always test EAs on a demo account first. Use MetaTrader's Strategy Tester to backtest on historical data, then forward test on a demo account for at least 2-4 weeks."
    },
    {
      question: "Can I modify the Expert Advisors?",
      answer: "Most EAs come with source code (MQ4/MQ5 files) that you can modify if you have programming knowledge. However, some EAs are provided as compiled files only (EX4/EX5)."
    },
    {
      question: "What's the difference between MT4 and MT5 Expert Advisors?",
      answer: "MT4 and MT5 use different programming languages (MQL4 vs MQL5) and are not cross-compatible. MT5 offers more features and faster backtesting, but MT4 has wider broker support."
    }
  ];

  const faqSchema = generateFAQPageSchema(faqs);

  const breadcrumbs = [{ name: 'Contact' }];

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact ForexFactory.cc",
    "description": "Get in touch with our support team for Expert Advisor help, technical support, or general inquiries.",
    "url": "https://forexfactory.cc/contact"
  };

  return (
    <HelmetProvider>
      <SEOHead
        title="Contact Us - ForexFactory.cc Support"
        description="Contact ForexFactory.cc for Expert Advisor support, technical help, or general inquiries. Our team is here to help you succeed with automated trading."
        keywords="contact ForexFactory, EA support, trading help, technical support, customer service"
        path={location}
        ogType="website"
        structuredData={[contactSchema, faqSchema]}
        breadcrumbs={breadcrumbs.map((b) => ({
          name: b.name,
          url: `https://forexfactory.cc${location}`
        }))}
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        {/* Page Header */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground">
              Have questions about our Expert Advisors? Need technical support? 
              We're here to help you succeed with automated trading.
            </p>
          </div>
        </section>
        
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="lg:col-span-1 space-y-6">
                {/* Contact Cards */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">support@forexfactory.cc</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-sm text-muted-foreground">Available Mon-Fri, 9AM-5PM EST</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Response Time</p>
                        <p className="text-sm text-muted-foreground">Within 24 hours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">Serving traders worldwide</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Quick Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-documentation">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Documentation
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-tutorials">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Video Tutorials
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-community">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Community Forum
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Support Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle>Support Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monday - Friday</span>
                        <span className="font-medium">9:00 AM - 5:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Saturday</span>
                        <span className="font-medium">10:00 AM - 2:00 PM EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sunday</span>
                        <span className="font-medium">Closed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Us a Message</CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} data-testid="input-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="john@example.com" 
                                    {...field} 
                                    data-testid="input-email"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-subject">
                                    <SelectValue placeholder="Select a subject" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="technical">Technical Support</SelectItem>
                                  <SelectItem value="ea-help">EA Installation Help</SelectItem>
                                  <SelectItem value="bug-report">Bug Report</SelectItem>
                                  <SelectItem value="feature-request">Feature Request</SelectItem>
                                  <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us how we can help you..."
                                  rows={6}
                                  {...field}
                                  data-testid="textarea-message"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="w-full md:w-auto"
                          disabled={submitMutation.isPending}
                          data-testid="button-send-message"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {submitMutation.isPending ? 'Sending...' : 'Send Message'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* FAQ Section */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-center mb-8">
                Frequently Asked Questions
              </h2>
              
              <Card className="max-w-4xl mx-auto">
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left" data-testid={`faq-${index}`}>
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </Layout>
    </HelmetProvider>
  );
}