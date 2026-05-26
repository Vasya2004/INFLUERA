import { PageHeader } from "@/components/app/page";
import { Card, CardContent } from "@/components/ui/card";

export default function AiProducer() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Producer" />
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Это страница в разработке
        </CardContent>
      </Card>
    </div>
  );
}
